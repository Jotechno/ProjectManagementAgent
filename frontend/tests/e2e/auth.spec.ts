import { test, expect } from "@playwright/test";

test.describe("Autenticación MVP - Pruebas E2E", () => {
  test("bloquea el acceso inicial al tablero, rechaza credenciales erróneas, permite iniciar y cerrar sesión", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("login-form")).toBeVisible();
    await expect(page.getByTestId("kanban-board")).not.toBeVisible();

    // Credenciales incorrectas
    await page.getByTestId("login-username-input").fill("user");
    await page.getByTestId("login-password-input").fill("bad-password");
    await page.getByTestId("login-submit-btn").click();
    await expect(page.getByTestId("login-error-msg")).toBeVisible();

    // Credenciales válidas ('user' / 'password')
    await page.getByTestId("login-username-input").fill("user");
    await page.getByTestId("login-password-input").fill("password");
    await page.getByTestId("login-submit-btn").click();

    await expect(page.getByTestId("kanban-board")).toBeVisible();
    await expect(page.getByTestId("logged-in-user")).toHaveText("user");

    // Persistir sesión tras recargar
    await page.reload();
    await expect(page.getByTestId("kanban-board")).toBeVisible();

    // Cerrar sesión
    await page.getByTestId("logout-btn").click();
    await expect(page.getByTestId("login-form")).toBeVisible();

    // Tras recargar sigue cerrada la sesión
    await page.reload();
    await expect(page.getByTestId("login-form")).toBeVisible();
  });
});

