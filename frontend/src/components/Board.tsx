"use client";

import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useKanban } from "@/hooks/useKanban";
import { Card } from "@/types/kanban";
import { Header } from "@/components/Header";
import { Column } from "@/components/Column";
import { NewCardModal } from "@/components/NewCardModal";

interface BoardProps {
  username?: string;
  onLogout?: () => void;
}

export function Board({ username, onLogout }: BoardProps = {}) {
  const { board, renameColumn, addCard, editCard, deleteCard, moveCard } =
    useKanban();
  const [activeModalColumnId, setActiveModalColumnId] = useState<string | null>(
    null
  );
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    moveCard(
      { droppableId: source.droppableId, index: source.index },
      { droppableId: destination.droppableId, index: destination.index }
    );
  };

  const totalCards = Object.keys(board.cards).length;
  const activeModalColumn = activeModalColumnId
    ? board.columns[activeModalColumnId]
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        totalCards={totalCards}
        username={username}
        onLogout={onLogout}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 overflow-x-auto">
        {mounted ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div
              data-testid="kanban-board"
              className="flex gap-5 items-start min-w-[1380px] lg:min-w-0"
            >
              {board.columnOrder.map((columnId) => {
                const column = board.columns[columnId];
                const cards = column.cardIds
                  .map((cardId) => board.cards[cardId])
                  .filter(Boolean);

                return (
                  <Column
                    key={column.id}
                    column={column}
                    cards={cards}
                    onRenameColumn={renameColumn}
                    onOpenNewCardModal={(colId) =>
                      setActiveModalColumnId(colId)
                    }
                    onEditCard={(card) => setEditingCard(card)}
                    onDeleteCard={deleteCard}
                  />
                );
              })}
            </div>
          </DragDropContext>
        ) : (
          <div className="flex gap-5 items-start">
            {board.columnOrder.map((columnId) => (
              <div
                key={columnId}
                className="h-96 flex-1 bg-slate-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        )}
      </main>

      {activeModalColumn && (
        <NewCardModal
          columnId={activeModalColumn.id}
          columnTitle={activeModalColumn.title}
          onClose={() => setActiveModalColumnId(null)}
          onAdd={addCard}
        />
      )}

      {editingCard && (
        <NewCardModal
          editingCard={editingCard}
          onClose={() => setEditingCard(null)}
          onEdit={editCard}
        />
      )}
    </div>
  );
}
