import { test, expect } from "@playwright/test";
import { initialBoardData } from "../../src/data/initialData";

test.describe("Tablero Kanban MVP - Pruebas de Integración E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post("/api/auth/login", {
      data: { username: "user", password: "password" },
    });
    await page.request.put("/api/board", {
      data: initialBoardData,
    });
    await page.request.post("/api/auth/logout");

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

  test("debe persistir en SQLite los cambios de columnas y tarjetas tras recargar y reautenticar", async ({
    page,
  }) => {
    // 1. Renombrar columna col-1
    const putRename = page.waitForResponse(
      (res) => res.url().includes("/api/board") && res.request().method() === "PUT"
    );
    await page.getByTestId("edit-column-col-1").click();
    await page.getByTestId("column-input-col-1").fill("Backlog Persistente");
    await page.getByTestId("save-column-col-1").click();
    await putRename;

    // 2. Crear nueva tarjeta en col-2
    const putAdd = page.waitForResponse(
      (res) => res.url().includes("/api/board") && res.request().method() === "PUT"
    );
    await page.getByTestId("add-card-btn-col-2").click();
    await page.getByTestId("new-card-title-input").fill("Tarea guardada en SQLite");
    await page
      .getByTestId("new-card-details-input")
      .fill("Persistencia verificada extremo a extremo.");
    await page.getByTestId("submit-card-btn").click();
    await putAdd;

    // 3. Editar tarjeta card-5
    const putEdit = page.waitForResponse(
      (res) => res.url().includes("/api/board") && res.request().method() === "PUT"
    );
    await page.getByTestId("edit-card-card-5").click();
    await page.getByTestId("edit-card-title-input").fill("Kanban conectado a SQLite");
    await page.getByTestId("submit-edit-card-btn").click();
    await putEdit;

    // 4. Eliminar tarjeta card-7
    const putDelete = page.waitForResponse(
      (res) => res.url().includes("/api/board") && res.request().method() === "PUT"
    );
    await page.getByTestId("delete-card-card-7").click();
    await putDelete;

    // Verificar persistencia tras recargar página
    await page.reload();
    await expect(page.getByTestId("kanban-board")).toBeVisible();
    await expect(page.getByTestId("column-title-col-1")).toHaveText(
      "Backlog Persistente"
    );
    await expect(page.getByTestId("droppable-col-2")).toContainText(
      "Tarea guardada en SQLite"
    );
    await expect(page.getByTestId("card-title-card-5")).toHaveText(
      "Kanban conectado a SQLite"
    );
    await expect(page.getByTestId("card-card-7")).not.toBeVisible();

    // Verificar persistencia tras cerrar sesión y volver a entrar
    await page.getByTestId("logout-btn").click();
    await expect(page.getByTestId("login-form")).toBeVisible();
    await page.getByTestId("login-username-input").fill("user");
    await page.getByTestId("login-password-input").fill("password");
    await page.getByTestId("login-submit-btn").click();

    await expect(page.getByTestId("kanban-board")).toBeVisible();
    await expect(page.getByTestId("column-title-col-1")).toHaveText(
      "Backlog Persistente"
    );
    await expect(page.getByTestId("droppable-col-2")).toContainText(
      "Tarea guardada en SQLite"
    );
    await expect(page.getByTestId("card-title-card-5")).toHaveText(
      "Kanban conectado a SQLite"
    );
    await expect(page.getByTestId("card-card-7")).not.toBeVisible();
  });

  test("debe permitir usar el chat con IA para crear y mover tarjetas actualizando el tablero en vivo y persistiendo al recargar", async ({
    page,
  }) => {
    await page.route("**/api/chat", async (route) => {
      const updatedBoard = {
        ...initialBoardData,
        cards: {
          ...initialBoardData.cards,
          "card-ia-e2e": {
            id: "card-ia-e2e",
            title: "Despliegue automatizado con IA",
            details: "Creada desde el asistente lateral",
          },
        },
        columns: {
          ...initialBoardData.columns,
          "col-1": {
            ...initialBoardData.columns["col-1"],
            cardIds: initialBoardData.columns["col-1"].cardIds.filter(
              (id) => id !== "card-1"
            ),
          },
          "col-3": {
            ...initialBoardData.columns["col-3"],
            cardIds: [
              ...initialBoardData.columns["col-3"].cardIds,
              "card-1",
              "card-ia-e2e",
            ],
          },
        },
      };

      await page.request.put("/api/board", { data: updatedBoard });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply:
            "He creado la tarjeta Despliegue automatizado con IA en En Progreso y movido Definir arquitectura de microservicios a En Progreso.",
          updated_board: updatedBoard,
        }),
      });
    });

    // Verificar colapso y reapertura de la barra lateral de chat
    await expect(page.getByTestId("chat-sidebar")).toBeVisible();
    await page.getByTestId("chat-toggle-btn").click();
    await expect(page.getByTestId("chat-sidebar-collapsed")).toBeVisible();
    await page.getByTestId("chat-toggle-btn").click();
    await expect(page.getByTestId("chat-sidebar")).toBeVisible();

    // Enviar instrucción al chat de IA
    await page
      .getByTestId("chat-input")
      .fill(
        "Crea la tarjeta Despliegue automatizado con IA en En Progreso y mueve Definir arquitectura de microservicios a En Progreso"
      );
    await page.getByTestId("chat-send-btn").click();

    // Verificar mensajes en el chat
    await expect(page.getByTestId("chat-message-0")).toContainText(
      "Crea la tarjeta Despliegue automatizado con IA"
    );
    await expect(page.getByTestId("chat-message-1")).toContainText(
      "He creado la tarjeta Despliegue automatizado con IA en En Progreso"
    );

    // Verificar actualización inmediata del tablero en la interfaz sin recargar
    const col3 = page.getByTestId("droppable-col-3");
    await expect(col3).toContainText("Despliegue automatizado con IA");
    await expect(col3.getByTestId("card-card-1")).toBeVisible();
    await expect(page.getByTestId("column-count-col-1")).toHaveText("1");
    await expect(page.getByTestId("column-count-col-3")).toHaveText("3");
    await expect(page.getByTestId("total-cards-badge")).toContainText(
      "8 tarjetas activas"
    );

    // Verificar que persiste tras recargar la página
    await page.reload();
    await expect(page.getByTestId("kanban-board")).toBeVisible();
    await expect(page.getByTestId("droppable-col-3")).toContainText(
      "Despliegue automatizado con IA"
    );
    await expect(
      page.getByTestId("droppable-col-3").getByTestId("card-card-1")
    ).toBeVisible();
  });
});
