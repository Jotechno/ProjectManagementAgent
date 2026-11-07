"use client";

import { useState } from "react";
import { LayoutGrid, Lock, User } from "lucide-react";

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
  error: string | null;
  isSubmitting: boolean;
}

export function LoginForm({ onLogin, error, isSubmitting }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(username.trim(), password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div
        data-testid="login-form"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 border-t-4 border-t-accent-yellow overflow-hidden"
      >
        <div className="bg-dark-navy px-6 py-6 text-white border-b-2 border-accent-yellow/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-blue/20 border border-primary-blue/40 text-accent-yellow">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Gestor de Proyectos Kanban
              </h1>
              <p className="text-xs text-text-gray">
                Inicia sesión para acceder a tu tablero
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              data-testid="login-error-msg"
              role="alert"
              className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="login-username"
              className="block text-xs font-semibold uppercase tracking-wider text-dark-navy mb-1.5"
            >
              Usuario
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-text-gray absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-username"
                data-testid="login-username-input"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm text-dark-navy rounded-xl border border-slate-200 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue transition-all placeholder:text-text-gray/60"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold uppercase tracking-wider text-dark-navy mb-1.5"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-gray absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                data-testid="login-password-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm text-dark-navy rounded-xl border border-slate-200 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue transition-all placeholder:text-text-gray/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="login-submit-btn"
            className="w-full py-2.5 px-4 rounded-xl bg-secondary-purple hover:opacity-95 disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
          >
            {isSubmitting ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

