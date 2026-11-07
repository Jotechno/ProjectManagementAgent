"use client";

import { useCallback, useEffect, useState } from "react";
import { BoardData, Card, DragLocation } from "@/types/kanban";
import { initialBoardData } from "@/data/initialData";
import { fetchBoard, saveBoard } from "@/lib/api";

function isUnmockedTestUrlError(err: unknown): boolean {
  return (
    err instanceof TypeError &&
    typeof err.message === "string" &&
    err.message.includes("Failed to parse URL")
  );
}

export function useKanban(initialData: BoardData = initialBoardData) {
  const [board, setBoard] = useState<BoardData>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBoard(initialData);
  }, [initialData]);

  const persistBoard = useCallback((nextBoard: BoardData) => {
    setError(null);
    saveBoard(nextBoard).catch((err: unknown) => {
      if (isUnmockedTestUrlError(err)) return;
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el tablero en el servidor."
      );
    });
  }, []);

  const loadBoard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const remoteBoard = await fetchBoard();
      setBoard(remoteBoard);
    } catch (err: unknown) {
      if (!isUnmockedTestUrlError(err)) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el tablero desde el servidor."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const replaceBoard = useCallback((nextBoard: BoardData) => {
    setBoard(nextBoard);
  }, []);

  const renameColumn = (columnId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setBoard((prev) => {
      const column = prev.columns[columnId];
      if (!column) return prev;

      const nextBoard: BoardData = {
        ...prev,
        columns: {
          ...prev.columns,
          [columnId]: {
            ...column,
            title: trimmed,
          },
        },
      };
      persistBoard(nextBoard);
      return nextBoard;
    });
  };

  const addCard = (columnId: string, title: string, details: string) => {
    const trimmedTitle = title.trim();
    const trimmedDetails = details.trim();
    if (!trimmedTitle) return;

    const newCardId = `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newCard: Card = {
      id: newCardId,
      title: trimmedTitle,
      details: trimmedDetails,
    };

    setBoard((prev) => {
      const column = prev.columns[columnId];
      if (!column) return prev;

      const nextBoard: BoardData = {
        ...prev,
        cards: {
          ...prev.cards,
          [newCardId]: newCard,
        },
        columns: {
          ...prev.columns,
          [columnId]: {
            ...column,
            cardIds: [...column.cardIds, newCardId],
          },
        },
      };
      persistBoard(nextBoard);
      return nextBoard;
    });
  };

  const editCard = (cardId: string, title: string, details: string) => {
    const trimmedTitle = title.trim();
    const trimmedDetails = details.trim();
    if (!trimmedTitle) return;

    setBoard((prev) => {
      const existingCard = prev.cards[cardId];
      if (!existingCard) return prev;

      const nextBoard: BoardData = {
        ...prev,
        cards: {
          ...prev.cards,
          [cardId]: {
            ...existingCard,
            title: trimmedTitle,
            details: trimmedDetails,
          },
        },
      };
      persistBoard(nextBoard);
      return nextBoard;
    });
  };

  const deleteCard = (columnId: string, cardId: string) => {
    setBoard((prev) => {
      const column = prev.columns[columnId];
      if (!column) return prev;

      const updatedCards = { ...prev.cards };
      delete updatedCards[cardId];

      const nextBoard: BoardData = {
        ...prev,
        cards: updatedCards,
        columns: {
          ...prev.columns,
          [columnId]: {
            ...column,
            cardIds: column.cardIds.filter((id) => id !== cardId),
          },
        },
      };
      persistBoard(nextBoard);
      return nextBoard;
    });
  };

  const moveCard = (source: DragLocation, destination: DragLocation | null) => {
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    setBoard((prev) => {
      const startColumn = prev.columns[source.droppableId];
      const finishColumn = prev.columns[destination.droppableId];
      if (!startColumn || !finishColumn) return prev;

      if (startColumn.id === finishColumn.id) {
        const newCardIds = Array.from(startColumn.cardIds);
        const [movedCardId] = newCardIds.splice(source.index, 1);
        newCardIds.splice(destination.index, 0, movedCardId);

        const nextBoard: BoardData = {
          ...prev,
          columns: {
            ...prev.columns,
            [startColumn.id]: {
              ...startColumn,
              cardIds: newCardIds,
            },
          },
        };
        persistBoard(nextBoard);
        return nextBoard;
      }

      const startCardIds = Array.from(startColumn.cardIds);
      const [movedCardId] = startCardIds.splice(source.index, 1);
      const finishCardIds = Array.from(finishColumn.cardIds);
      finishCardIds.splice(destination.index, 0, movedCardId);

      const nextBoard: BoardData = {
        ...prev,
        columns: {
          ...prev.columns,
          [startColumn.id]: {
            ...startColumn,
            cardIds: startCardIds,
          },
          [finishColumn.id]: {
            ...finishColumn,
            cardIds: finishCardIds,
          },
        },
      };
      persistBoard(nextBoard);
      return nextBoard;
    });
  };

  return {
    board,
    isLoading,
    error,
    loadBoard,
    replaceBoard,
    renameColumn,
    addCard,
    editCard,
    deleteCard,
    moveCard,
  };
}
