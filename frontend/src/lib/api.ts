import { BoardData } from "@/types/kanban";

export interface AuthUser {
  username: string;
}

export async function getMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res || !res.ok) {
    return null;
  }
  return res.json();
}

export async function login(
  username: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || "Usuario o contraseña incorrectos.");
  }

  return res.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  }).catch(() => null);
}

export async function fetchBoard(): Promise<BoardData> {
  const res = await fetch("/api/board", { credentials: "include" });
  if (!res || !res.ok) {
    throw new Error("No se pudo cargar el tablero desde el servidor.");
  }
  return res.json();
}

export async function saveBoard(board: BoardData): Promise<BoardData> {
  const res = await fetch("/api/board", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(board),
  });
  if (!res || !res.ok) {
    throw new Error("No se pudo guardar el tablero en el servidor.");
  }
  return res.json();
}

