"use client";

import { useEffect, useState } from "react";
import { Board } from "@/components/Board";
import { LoginForm } from "@/components/LoginForm";
import { BoardData } from "@/types/kanban";
import { initialBoardData } from "@/data/initialData";
import { fetchBoard, getMe, login, logout } from "@/lib/api";

export default function HomePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [userBoard, setUserBoard] = useState<BoardData>(initialBoardData);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await getMe();
        if (!active || !user) return;
        const remoteBoard = await fetchBoard().catch(() => initialBoardData);
        if (!active) return;
        setUserBoard(remoteBoard);
        setUsername(user.username);
      } finally {
        if (active) setCheckingAuth(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (user: string, password: string) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const loggedUser = await login(user, password);
      const remoteBoard = await fetchBoard().catch(() => initialBoardData);
      setUserBoard(remoteBoard);
      setUsername(loggedUser.username);
    } catch (err: unknown) {
      setAuthError(
        err instanceof Error
          ? err.message
          : "No fue posible conectar con el servidor."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUsername(null);
  };

  if (checkingAuth) {
    return (
      <div
        data-testid="auth-loading"
        className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-medium text-text-gray"
      >
        Verificando sesión...
      </div>
    );
  }

  if (!username) {
    return (
      <LoginForm
        onLogin={handleLogin}
        error={authError}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <Board
      username={username}
      onLogout={handleLogout}
      initialBoard={userBoard}
    />
  );
}
