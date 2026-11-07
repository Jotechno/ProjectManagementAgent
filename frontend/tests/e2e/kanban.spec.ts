import { test, expect } from "@playwright/test";

test.describe("Tablero Kanban MVP - Pruebas de Integración E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("login-form")).toBeVisible();
    await page.getByTestId("login-username-input").fill("user");
    await page.getByTestId("login-password-input").fill("password");
    await page.getByTestId("login-submit-btn").click();
    await expect(page.getByTestId("kanban-board")).toBeVisible();
  });

  test("debe mostrar el tablero único con 5 columnas fijas y datos de ejemplo iniciales", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Gestor de Proyectos Kanban" })
    ).toBeVisible();

    const expectedColumns = [
      { id: "col-1", title: "Backlog" },
      { id: "col-2", title: "Por Hacer" },
      { id: "col-3", title: "En Progreso" },
      { id: "col-4", title: "En Revisión" },
      { id: "col-5", title: "Completado" },
    ];

    for (const col of expectedColumns) {
      await expect(page.getByTestId(`column-${col.id}`)).toBeVisible();
      await expect(page.getByTestId(`column-title-${col.id}`)).toHaveText(
        col.title
      );
    }

    await expect(page.getByTestId("total-cards-badge")).toContainText(
      "7 tarjetas activas"
    );
    await expect(page.getByTestId("card-card-1")).toBeVisible();
  });

  test("debe permitir renombrar cualquiera de las 5 columnas fijas", async ({
    page,
  }) => {
    await page.getByTestId("edit-column-col-1").click();
    const input = page.getByTestId("column-input-col-1");
    await expect(input).toBeVisible();

    await input.fill("Ideas Pendientes");
    await page.getByTestId("save-column-col-1").click();

    await expect(page.getByTestId("column-title-col-1")).toHaveText(
      "Ideas Pendientes"
    );
  });

  test("debe permitir agregar una nueva tarjeta con título y detalles a una columna", async ({
    page,
  }) => {
    await page.getByTestId("add-card-btn-col-3").click();
    await expect(page.getByTestId("new-card-modal")).toBeVisible();

    // Validar que no permita guardar sin título
    await page.getByTestId("submit-card-btn").click();
    await expect(page.getByTestId("title-error-msg")).toBeVisible();

    // Llenar título y detalles
    await page
      .getByTestId("new-card-title-input")
      .fill("Integrar pasarela de pagos");
    await page
      .getByTestId("new-card-details-input")
      .fill("Configurar webhooks y entorno de pruebas.");
    await page.getByTestId("submit-card-btn").click();

    await expect(page.getByTestId("new-card-modal")).not.toBeVisible();

    const col3 = page.getByTestId("droppable-col-3");
    await expect(col3).toContainText("Integrar pasarela de pagos");
    await expect(col3).toContainText(
      "Configurar webhooks y entorno de pruebas."
    );
    await expect(page.getByTestId("column-count-col-3")).toHaveText("2");
    await expect(page.getByTestId("total-cards-badge")).toContainText(
      "8 tarjetas activas"
    );
  });

  test("debe permitir eliminar una tarjeta existente de una columna", async ({
    page,
  }) => {
    await expect(page.getByTestId("card-card-1")).toBeVisible();
    await expect(page.getByTestId("column-count-col-1")).toHaveText("2");

    await page.getByTestId("delete-card-card-1").click();

    await expect(page.getByTestId("card-card-1")).not.toBeVisible();
    await expect(page.getByTestId("column-count-col-1")).toHaveText("1");
    await expect(page.getByTestId("total-cards-badge")).toContainText(
      "6 tarjetas activas"
    );
  });

  test("debe permitir editar el título y detalles de una tarjeta existente", async ({
    page,
  }) => {
    await page.getByTestId("edit-card-card-2").click();
    await expect(page.getByTestId("edit-card-modal")).toBeVisible();

    await page
      .getByTestId("edit-card-title-input")
      .fill("Auditoría WCAG completada");
    await page
      .getByTestId("edit-card-details-input")
      .fill("Contraste y foco validados en todos los componentes.");
    await page.getByTestId("submit-edit-card-btn").click();

    await expect(page.getByTestId("edit-card-modal")).not.toBeVisible();
    await expect(page.getByTestId("card-title-card-2")).toHaveText(
      "Auditoría WCAG completada"
    );
    await expect(page.getByTestId("card-details-card-2")).toHaveText(
      "Contraste y foco validados en todos los componentes."
    );
  });

  test("debe permitir arrastrar y soltar una tarjeta entre columnas", async ({
    page,
  }) => {
    const card1 = page.getByTestId("card-card-1");
    const col2Droppable = page.getByTestId("droppable-col-2");

    await expect(page.getByTestId("column-count-col-1")).toHaveText("2");
    await expect(page.getByTestId("column-count-col-2")).toHaveText("2");

    // Drag and drop usando mouse
    const cardBox = await card1.boundingBox();
    const targetBox = await col2Droppable.boundingBox();

    if (!cardBox || !targetBox) {
      throw new Error("No se pudieron obtener las coordenadas para drag and drop");
    }

    await page.mouse.move(
      cardBox.x + cardBox.width / 2,
      cardBox.y + cardBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      cardBox.x + cardBox.width / 2 + 10,
      cardBox.y + cardBox.height / 2 + 5,
      { steps: 5 }
    );
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + 80,
      { steps: 15 }
    );
    await page.mouse.up();

    await expect(page.getByTestId("column-count-col-1")).toHaveText("1");
    await expect(page.getByTestId("column-count-col-2")).toHaveText("3");
    await expect(col2Droppable.getByTestId("card-card-1")).toBeVisible();
  });
});
