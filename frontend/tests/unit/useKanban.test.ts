import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useKanban } from "@/hooks/useKanban";
import { initialBoardData } from "@/data/initialData";

describe("useKanban Hook - Pruebas Unitarias", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });
  it("debe inicializar el tablero con 5 columnas fijas y tarjetas de ejemplo", () => {
    const { result } = renderHook(() => useKanban());

    expect(result.current.board.columnOrder).toHaveLength(5);
    expect(result.current.board.columnOrder).toEqual([
      "col-1",
      "col-2",
      "col-3",
      "col-4",
      "col-5",
    ]);
    expect(Object.keys(result.current.board.cards).length).toBeGreaterThan(0);
    expect(result.current.board.columns["col-1"].title).toBe("Backlog");
  });

  it("debe permitir renombrar una columna existente", () => {
    const { result } = renderHook(() => useKanban());

    act(() => {
      result.current.renameColumn("col-1", "  Ideas Iniciales  ");
    });

    expect(result.current.board.columns["col-1"].title).toBe("Ideas Iniciales");
  });

  it("no debe renombrar una columna si el nuevo nombre está vacío", () => {
    const { result } = renderHook(() => useKanban());

    act(() => {
      result.current.renameColumn("col-1", "   ");
    });

    expect(result.current.board.columns["col-1"].title).toBe("Backlog");
  });

  it("debe agregar una nueva tarjeta con título y detalles a una columna", () => {
    const { result } = renderHook(() => useKanban());
    const initialCount = result.current.board.columns["col-2"].cardIds.length;

    act(() => {
      result.current.addCard(
        "col-2",
        "Nueva tarea de prueba",
        "Detalles de la tarea de prueba"
      );
    });

    const updatedCardIds = result.current.board.columns["col-2"].cardIds;
    expect(updatedCardIds).toHaveLength(initialCount + 1);

    const newCardId = updatedCardIds[updatedCardIds.length - 1];
    const newCard = result.current.board.cards[newCardId];
    expect(newCard).toBeDefined();
    expect(newCard.title).toBe("Nueva tarea de prueba");
    expect(newCard.details).toBe("Detalles de la tarea de prueba");
  });

  it("no debe agregar una tarjeta si el título está vacío", () => {
    const { result } = renderHook(() => useKanban());
    const initialTotal = Object.keys(result.current.board.cards).length;

    act(() => {
      result.current.addCard("col-1", "   ", "Detalles sin título");
    });

    expect(Object.keys(result.current.board.cards)).toHaveLength(initialTotal);
  });

  it("debe editar el título y detalles de una tarjeta existente", () => {
    const { result } = renderHook(() => useKanban());

    act(() => {
      result.current.editCard(
        "card-1",
        "  Arquitectura actualizada  ",
        "  Nuevos detalles de arquitectura  "
      );
    });

    expect(result.current.board.cards["card-1"].title).toBe(
      "Arquitectura actualizada"
    );
    expect(result.current.board.cards["card-1"].details).toBe(
      "Nuevos detalles de arquitectura"
    );
  });

  it("no debe editar una tarjeta si el nuevo título está vacío", () => {
    const { result } = renderHook(() => useKanban());
    const originalTitle = result.current.board.cards["card-1"].title;

    act(() => {
      result.current.editCard("card-1", "   ", "Detalles ignorados");
    });

    expect(result.current.board.cards["card-1"].title).toBe(originalTitle);
  });

  it("debe eliminar una tarjeta existente de su columna y del diccionario", () => {
    const { result } = renderHook(() => useKanban());
    const targetCardId = initialBoardData.columns["col-1"].cardIds[0];

    act(() => {
      result.current.deleteCard("col-1", targetCardId);
    });

    expect(result.current.board.columns["col-1"].cardIds).not.toContain(
      targetCardId
    );
    expect(result.current.board.cards[targetCardId]).toBeUndefined();
  });

  it("debe reordenar tarjetas dentro de la misma columna", () => {
    const { result } = renderHook(() => useKanban());
    const [firstId, secondId] = result.current.board.columns["col-1"].cardIds;

    act(() => {
      result.current.moveCard(
        { droppableId: "col-1", index: 0 },
        { droppableId: "col-1", index: 1 }
      );
    });

    expect(result.current.board.columns["col-1"].cardIds).toEqual([
      secondId,
      firstId,
    ]);
  });

  it("debe mover una tarjeta de una columna a otra", () => {
    const { result } = renderHook(() => useKanban());
    const movingCardId = result.current.board.columns["col-1"].cardIds[0];

    act(() => {
      result.current.moveCard(
        { droppableId: "col-1", index: 0 },
        { droppableId: "col-3", index: 0 }
      );
    });

    expect(result.current.board.columns["col-1"].cardIds).not.toContain(
      movingCardId
    );
    expect(result.current.board.columns["col-3"].cardIds[0]).toBe(movingCardId);
  });

  it("no debe modificar el estado si el destino de moveCard es nulo o igual al origen", () => {
    const { result } = renderHook(() => useKanban());
    const beforeBoard = result.current.board;

    act(() => {
      result.current.moveCard({ droppableId: "col-1", index: 0 }, null);
      result.current.moveCard(
        { droppableId: "col-1", index: 0 },
        { droppableId: "col-1", index: 0 }
      );
    });

    expect(result.current.board).toBe(beforeBoard);
  });

  it("sincroniza con PUT /api/board en cada mutación y reporta error si falla la API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => initialBoardData,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);
    global.fetch = fetchMock;

    const { result } = renderHook(() => useKanban());

    act(() => {
      result.current.renameColumn("col-1", "Backlog Sincronizado");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/board",
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
      })
    );

    act(() => {
      result.current.deleteCard("col-1", "card-1");
    });

    await waitFor(() => {
      expect(result.current.error).toBe(
        "No se pudo guardar el tablero en el servidor."
      );
    });
  });

  it("permite cargar el tablero desde GET /api/board y reemplazarlo con replaceBoard", async () => {
    const remoteBoard = {
      ...initialBoardData,
      columns: {
        ...initialBoardData.columns,
        "col-2": {
          ...initialBoardData.columns["col-2"],
          title: "Por Hacer Desde API",
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => remoteBoard,
    } as Response);

    const { result } = renderHook(() => useKanban());

    await act(async () => {
      await result.current.loadBoard();
    });

    expect(result.current.board.columns["col-2"].title).toBe(
      "Por Hacer Desde API"
    );

    act(() => {
      result.current.replaceBoard(initialBoardData);
    });
    expect(result.current.board.columns["col-2"].title).toBe("Por Hacer");
  });
});
