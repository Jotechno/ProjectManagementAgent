import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import HomePage from "@/app/page";

describe("Flujo de Autenticación - Pruebas Unitarias", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("muestra el formulario de inicio de sesión cuando no hay sesión activa", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("kanban-board")).not.toBeInTheDocument();
  });

  it("muestra mensaje de error con credenciales inválidas y accede al tablero con credenciales válidas", async () => {
    global.fetch = vi
      .fn()
      // GET /api/auth/me inicial -> 401
      .mockResolvedValueOnce({ ok: false, status: 401 } as Response)
      // POST /api/auth/login fallido -> 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Credenciales inválidas" }),
      } as Response)
      // POST /api/auth/login exitoso -> 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ username: "user" }),
      } as Response)
      // POST /api/auth/logout -> 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: "logged_out" }),
      } as Response);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("login-username-input"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "incorrecta" },
    });
    fireEvent.click(screen.getByTestId("login-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("login-error-msg")).toHaveTextContent(
        "Credenciales inválidas"
      );
    });

    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByTestId("login-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("kanban-board")).toBeInTheDocument();
    });
    expect(screen.getByTestId("logged-in-user")).toHaveTextContent("user");

    fireEvent.click(screen.getByTestId("logout-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
  });
});

