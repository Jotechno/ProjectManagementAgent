import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChatSidebar } from "@/components/ChatSidebar";
import { initialBoardData } from "@/data/initialData";
import { BoardData } from "@/types/kanban";

describe("ChatSidebar - Pruebas Unitarias", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("permite colapsar y expandir la barra lateral de chat", () => {
    render(<ChatSidebar />);

    expect(screen.getByTestId("chat-sidebar")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("chat-toggle-btn"));

    expect(screen.queryByTestId("chat-sidebar")).not.toBeInTheDocument();
    expect(screen.getByTestId("chat-sidebar-collapsed")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("chat-toggle-btn"));
    expect(screen.getByTestId("chat-sidebar")).toBeInTheDocument();
  });

  it("envía mensajes, muestra el estado Pensando... y renderiza el historial de conversación", async () => {
    let resolveFetch!: (val: unknown) => void;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ChatSidebar />);

    const input = screen.getByTestId("chat-input");
    fireEvent.change(input, {
      target: { value: "Hola, ¿cuántas tarjetas hay?" },
    });
    fireEvent.click(screen.getByTestId("chat-send-btn"));

    expect(screen.getByTestId("chat-loading")).toHaveTextContent("Pensando...");
    expect(screen.getByTestId("chat-input")).toBeDisabled();
    expect(screen.getByTestId("chat-send-btn")).toBeDisabled();
    expect(screen.getByTestId("chat-message-0")).toHaveTextContent(
      "Hola, ¿cuántas tarjetas hay?"
    );

    resolveFetch({
      ok: true,
      json: async () => ({
        reply: "Actualmente hay 7 tarjetas en tu tablero.",
        updated_board: null,
      }),
    });

    await waitFor(() => {
      expect(screen.queryByTestId("chat-loading")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("chat-message-1")).toHaveTextContent(
      "Actualmente hay 7 tarjetas en tu tablero."
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "Hola, ¿cuántas tarjetas hay?",
          history: [],
        }),
      })
    );
  });

  it("notifica onBoardUpdate cuando la respuesta incluye updated_board", async () => {
    const updatedBoard: BoardData = {
      ...initialBoardData,
      cards: {
        ...initialBoardData.cards,
        "card-ia-1": {
          id: "card-ia-1",
          title: "Tarjeta creada por IA",
          details: "Generada desde ChatSidebar",
        },
      },
      columns: {
        ...initialBoardData.columns,
        "col-1": {
          ...initialBoardData.columns["col-1"],
          cardIds: [...initialBoardData.columns["col-1"].cardIds, "card-ia-1"],
        },
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "He creado la tarjeta solicitada en Backlog.",
        updated_board: updatedBoard,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onBoardUpdate = vi.fn();
    render(<ChatSidebar onBoardUpdate={onBoardUpdate} />);

    const input = screen.getByTestId("chat-input");
    fireEvent.change(input, {
      target: { value: "Crea una tarjeta en Backlog" },
    });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(onBoardUpdate).toHaveBeenCalledWith(updatedBoard);
    });
    expect(screen.getByTestId("chat-message-1")).toHaveTextContent(
      "He creado la tarjeta solicitada en Backlog."
    );
  });

  it("muestra un mensaje de error claro cuando la petición al servidor falla", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: "Error de comunicación con el servicio de IA Gemini.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ChatSidebar />);

    fireEvent.change(screen.getByTestId("chat-input"), {
      target: { value: "Intenta actualizar el tablero" },
    });
    fireEvent.click(screen.getByTestId("chat-send-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("chat-error")).toHaveTextContent(
        "Error de comunicación con el servicio de IA Gemini."
      );
    });
  });
});

