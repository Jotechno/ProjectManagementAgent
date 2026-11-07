"use client";

import { LayoutGrid, LogOut } from "lucide-react";

interface HeaderProps {
  totalCards: number;
  username?: string;
  onLogout?: () => void;
}

export function Header({ totalCards, username, onLogout }: HeaderProps) {
  return (
    <header className="bg-dark-navy text-white border-b-4 border-accent-yellow shadow-md">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-blue/20 border border-primary-blue/40 text-accent-yellow">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Gestor de Proyectos Kanban
            </h1>
            <p className="text-xs text-text-gray">
              Tablero de flujo de trabajo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            data-testid="total-cards-badge"
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-blue/20 text-primary-blue border border-primary-blue/30"
          >
            {totalCards} {totalCards === 1 ? "tarjeta activa" : "tarjetas activas"}
          </span>

          {username && (
            <span
              data-testid="logged-in-user"
              className="text-xs font-medium text-slate-200 px-2.5 py-1 rounded-lg bg-white/10"
            >
              {username}
            </span>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              data-testid="logout-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary-purple hover:opacity-90 text-white transition-opacity cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
