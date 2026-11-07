"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Trash2, GripVertical, Pencil } from "lucide-react";
import { Card } from "@/types/kanban";

interface CardItemProps {
  card: Card;
  index: number;
  columnId: string;
  onEdit: (card: Card) => void;
  onDelete: (columnId: string, cardId: string) => void;
}

export function CardItem({
  card,
  index,
  columnId,
  onEdit,
  onDelete,
}: CardItemProps) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-testid={`card-${card.id}`}
          className={`group bg-white rounded-xl p-4 mb-3 border border-slate-200 border-l-4 transition-all duration-150 select-none ${
            snapshot.isDragging
              ? "border-l-accent-yellow shadow-xl ring-2 ring-accent-yellow/40 rotate-1 scale-[1.02]"
              : "border-l-primary-blue shadow-sm hover:shadow-md hover:border-l-accent-yellow"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <GripVertical className="w-4 h-4 text-text-gray/50 mt-0.5 shrink-0 group-hover:text-primary-blue transition-colors" />
              <h3
                data-testid={`card-title-${card.id}`}
                className="text-sm font-semibold text-dark-navy leading-snug break-words"
              >
                {card.title}
              </h3>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(card);
                }}
                data-testid={`edit-card-${card.id}`}
                aria-label={`Editar tarjeta ${card.title}`}
                className="text-text-gray hover:text-primary-blue hover:bg-primary-blue/10 p-1.5 rounded-lg transition-colors"
                title="Editar tarjeta"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(columnId, card.id);
                }}
                data-testid={`delete-card-${card.id}`}
                aria-label={`Eliminar tarjeta ${card.title}`}
                className="text-text-gray hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                title="Eliminar tarjeta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {card.details && (
            <p
              data-testid={`card-details-${card.id}`}
              className="mt-2 pl-6 text-xs text-text-gray leading-relaxed break-words"
            >
              {card.details}
            </p>
          )}
        </div>
      )}
    </Draggable>
  );
}
