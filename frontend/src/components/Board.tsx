"use client";

import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useKanban } from "@/hooks/useKanban";
import { BoardData, Card } from "@/types/kanban";
import { initialBoardData } from "@/data/initialData";
import { Header } from "@/components/Header";
import { Column } from "@/components/Column";
import { NewCardModal } from "@/components/NewCardModal";
import { ChatSidebar } from "@/components/ChatSidebar";

interface BoardProps {
  username?: string;
  onLogout?: () => void;
  initialBoard?: BoardData;
}

export function Board({
  username,
  onLogout,
  initialBoard = initialBoardData,
}: BoardProps = {}) {
  const {
    board,
    error,
    replaceBoard,
    renameColumn,
    addCard,
    editCard,
    deleteCard,
    moveCard,
  } = useKanban(initialBoard);
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

      {error && (
        <div
          data-testid="board-sync-error"
          role="alert"
          className="max-w-[1600px] w-full mx-auto mt-4 px-6"
        >
          <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            {error}
          </div>
        </div>
      )}

      <div className="flex-1 flex w-full max-w-[1920px] mx-auto overflow-hidden">
        <main className="flex-1 px-6 py-6 overflow-x-auto">
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

        <ChatSidebar onBoardUpdate={replaceBoard} />
      </div>

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
