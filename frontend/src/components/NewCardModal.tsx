"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Card } from "@/types/kanban";

interface NewCardModalProps {
  columnId?: string;
  columnTitle?: string;
  editingCard?: Card;
  onClose: () => void;
  onAdd?: (columnId: string, title: string, details: string) => void;
  onEdit?: (cardId: string, title: string, details: string) => void;
}

export function NewCardModal({
  columnId,
  columnTitle,
  editingCard,
  onClose,
  onAdd,
  onEdit,
}: NewCardModalProps) {
  const isEditMode = Boolean(editingCard);
  const [title, setTitle] = useState(editingCard?.title ?? "");
  const [details, setDetails] = useState(editingCard?.details ?? "");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(true);
      return;
    }
    if (isEditMode && editingCard && onEdit) {
      onEdit(editingCard.id, title, details);
    } else if (columnId && onAdd) {
      onAdd(columnId, title, details);
    }
    onClose();
  };

  return (
    <div
      data-testid={isEditMode ? "edit-card-modal-backdrop" : "new-card-modal-backdrop"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-navy/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        data-testid={isEditMode ? "edit-card-modal" : "new-card-modal"}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-accent-yellow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-dark-navy">
              {isEditMode ? "Editar Tarjeta" : "Nueva Tarjeta"}
            </h2>
            {!isEditMode && columnTitle && (
              <p className="text-xs text-text-gray">
                Columna destino:{" "}
                <span className="font-semibold text-primary-blue">
                  {columnTitle}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-modal-btn"
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-text-gray hover:text-dark-navy hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="card-title-input"
              className="block text-xs font-semibold uppercase tracking-wider text-dark-navy mb-1.5"
            >
              Título
            </label>
            <input
              id="card-title-input"
              data-testid={isEditMode ? "edit-card-title-input" : "new-card-title-input"}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Ej. Implementar autenticación"
              autoFocus
              className={`w-full px-3.5 py-2.5 text-sm text-dark-navy rounded-xl border ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-200 focus:border-primary-blue focus:ring-primary-blue"
              } focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all placeholder:text-text-gray/60`}
            />
            {error && (
              <p
                data-testid="title-error-msg"
                className="mt-1 text-xs text-red-600"
              >
                El título de la tarjeta es obligatorio.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="card-details-input"
              className="block text-xs font-semibold uppercase tracking-wider text-dark-navy mb-1.5"
            >
              Detalles
            </label>
            <textarea
              id="card-details-input"
              data-testid={isEditMode ? "edit-card-details-input" : "new-card-details-input"}
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe brevemente la tarea..."
              className="w-full px-3.5 py-2.5 text-sm text-dark-navy rounded-xl border border-slate-200 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue transition-all resize-none placeholder:text-text-gray/60"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              data-testid="cancel-card-btn"
              className="px-4 py-2 text-sm font-medium text-text-gray hover:text-dark-navy rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid={isEditMode ? "submit-edit-card-btn" : "submit-card-btn"}
              className="px-5 py-2 text-sm font-semibold text-white bg-secondary-purple hover:opacity-95 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {isEditMode ? "Guardar Cambios" : "Guardar Tarjeta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
