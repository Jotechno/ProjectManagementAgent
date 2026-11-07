"use client";

import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Pencil, Check, Plus } from "lucide-react";
import { Card, Column as ColumnType } from "@/types/kanban";
import { CardItem } from "@/components/CardItem";

interface ColumnProps {
  column: ColumnType;
  cards: Card[];
  onRenameColumn: (columnId: string, newTitle: string) => void;
  onOpenNewCardModal: (columnId: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
}

export function Column({
  column,
  cards,
  onRenameColumn,
  onOpenNewCardModal,
  onEditCard,
  onDeleteCard,
}: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(column.title);

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== column.title) {
      onRenameColumn(column.id, trimmed);
    } else {
      setTitleInput(column.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setTitleInput(column.title);
      setIsEditing(false);
    }
  };

  return (
    <section
      data-testid={`column-${column.id}`}
      className="flex flex-col bg-slate-100/90 rounded-2xl border border-slate-200/80 border-t-4 border-t-accent-yellow shadow-sm min-w-[270px] w-full flex-1 max-h-[calc(100vh-130px)]"
    >
      {/* Column Header */}
      <div className="p-4 pb-3 flex items-center justify-between gap-2 border-b border-slate-200/70 bg-white/60 rounded-t-xl">
        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              data-testid={`column-input-${column.id}`}
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              autoFocus
              aria-label="Editar nombre de columna"
              className="w-full px-2.5 py-1 text-sm font-bold text-dark-navy bg-white border-2 border-primary-blue rounded-lg focus:outline-none"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSaveTitle}
              data-testid={`save-column-${column.id}`}
              aria-label="Guardar nombre de columna"
              className="p-1.5 rounded-lg bg-primary-blue text-white hover:opacity-90 transition-opacity shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h2
                data-testid={`column-title-${column.id}`}
                onClick={() => {
                  setTitleInput(column.title);
                  setIsEditing(true);
                }}
                className="text-sm font-bold text-dark-navy truncate cursor-pointer hover:text-primary-blue transition-colors"
                title="Haz clic para renombrar la columna"
              >
                {column.title}
              </h2>
              <span
                data-testid={`column-count-${column.id}`}
                className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary-blue/15 text-primary-blue shrink-0"
              >
                {cards.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTitleInput(column.title);
                setIsEditing(true);
              }}
              data-testid={`edit-column-${column.id}`}
              aria-label={`Renombrar columna ${column.title}`}
              className="p-1.5 rounded-lg text-text-gray hover:text-primary-blue hover:bg-primary-blue/10 transition-colors shrink-0"
              title="Renombrar columna"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Droppable Cards Container */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            data-testid={`droppable-${column.id}`}
            className={`flex-1 p-3 overflow-y-auto min-h-[180px] transition-colors duration-150 ${
              snapshot.isDraggingOver ? "bg-primary-blue/10" : ""
            }`}
          >
            {cards.length === 0 && !snapshot.isDraggingOver && (
              <div
                data-testid={`empty-column-${column.id}`}
                className="h-28 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-xs text-text-gray text-center px-4"
              >
                Sin tarjetas en esta columna
              </div>
            )}

            {cards.map((card, index) => (
              <CardItem
                key={card.id}
                card={card}
                index={index}
                columnId={column.id}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Column Footer */}
      <div className="p-3 pt-2 border-t border-slate-200/70 bg-white/50 rounded-b-2xl">
        <button
          type="button"
          onClick={() => onOpenNewCardModal(column.id)}
          data-testid={`add-card-btn-${column.id}`}
          className="w-full py-2 px-3 rounded-xl bg-secondary-purple hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar tarjeta</span>
        </button>
      </div>
    </section>
  );
}
