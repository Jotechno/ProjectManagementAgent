"use client";

import { useState } from "react";
import { BoardData, Card, DragLocation } from "@/types/kanban";
import { initialBoardData } from "@/data/initialData";

export function useKanban(initialData: BoardData = initialBoardData) {
  const [board, setBoard] = useState<BoardData>(initialData);

  const renameColumn = (columnId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setBoard((prev) => {
      const column = prev.columns[columnId];
      if (!column) return prev;

      return {
        ...prev,
        columns: {
          ...prev.columns,
          [columnId]: {
            ...column,
            title: trimmed,
          },
        },
      };
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

      return {
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
    });
  };

  const editCard = (cardId: string, title: string, details: string) => {
    const trimmedTitle = title.trim();
    const trimmedDetails = details.trim();
    if (!trimmedTitle) return;

    setBoard((prev) => {
      const existingCard = prev.cards[cardId];
      if (!existingCard) return prev;

      return {
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
    });
  };

  const deleteCard = (columnId: string, cardId: string) => {
    setBoard((prev) => {
      const column = prev.columns[columnId];
      if (!column) return prev;

      const updatedCards = { ...prev.cards };
      delete updatedCards[cardId];

      return {
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

        return {
          ...prev,
          columns: {
            ...prev.columns,
            [startColumn.id]: {
              ...startColumn,
              cardIds: newCardIds,
            },
          },
        };
      }

      const startCardIds = Array.from(startColumn.cardIds);
      const [movedCardId] = startCardIds.splice(source.index, 1);
      const finishCardIds = Array.from(finishColumn.cardIds);
      finishCardIds.splice(destination.index, 0, movedCardId);

      return {
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
    });
  };

  return {
    board,
    renameColumn,
    addCard,
    editCard,
    deleteCard,
    moveCard,
  };
}
