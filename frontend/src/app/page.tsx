"use client";

import { useEffect, useState } from "react";
import { Board } from "@/components/Board";
import { LoginForm } from "@/components/LoginForm";

export default function HomePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setUsername(data.username);
        }
      })
      .catch(() => {
        // Sin sesión activa
      })
      .finally(() => {
        if (active) setCheckingAuth(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (user: string, password: string) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: user, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setAuthError(errData?.detail || "Usuario o contraseña incorrectos.");
        return;
      }

      const data = await res.json();
      setUsername(data.username);
    } catch {
      setAuthError("No fue posible conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);
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

  return <Board username={username} onLogout={handleLogout} />;
}
