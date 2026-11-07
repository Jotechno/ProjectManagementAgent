# Frontend - Tablero Kanban (Punto de Partida)

## Resumen

Aplicación web cliente construida con Next.js 15 (App Router), React 19 y TypeScript 5.7. En su estado inicial funciona como una demostración puramente en el navegador (estado en memoria), sin conexión a backend ni configuración para exportación estática en Docker.

## Stack Tecnológico

- **Framework**: Next.js `^15.2.0` con React `^19.0.0`
- **Estilos**: Tailwind CSS `^3.4.17` y variables CSS globales
- **Drag and Drop**: `@hello-pangea/dnd` `^18.0.1`
- **Iconos**: `lucide-react` `^0.475.0`
- **Pruebas Unitarias**: Vitest `^3.0.5`, React Testing Library y `jsdom`
- **Pruebas E2E**: Playwright `^1.50.0` (Chromium)

## Estructura del Código

- `src/app/`
  - `layout.tsx`: Layout raíz en español (`lang="es"`) y metadatos básicos.
  - `page.tsx`: Página principal (`HomePage`) marcada con `"use client"` que renderiza `Board`.
  - `globals.css`: Directivas de Tailwind y variables CSS de la paleta corporativa.
- `src/types/kanban.ts`
  - Define las interfaces principales: `Card` (`id`, `title`, `details`), `Column` (`id`, `title`, `cardIds`), `BoardData` (`columns`, `cards`, `columnOrder`) y `DragLocation`.
- `src/data/initialData.ts`
  - Define `initialBoardData` con 5 columnas fijas (`col-1` a `col-5`: Backlog, Por Hacer, En Progreso, En Revisión, Completado) y 7 tarjetas iniciales de demostración.
- `src/hooks/useKanban.ts`
  - Hook personalizado que administra el estado local `BoardData` y expone `renameColumn`, `addCard`, `deleteCard` y `moveCard`.
- `src/components/`
  - `Board.tsx`: Contenedor principal. Renderiza `Header`, `DragDropContext` con las 5 instancias de `Column` según `columnOrder` y el modal `NewCardModal`. Controla `mounted` para evitar discrepancias de hidratación con el drag and drop.
  - `Header.tsx`: Barra superior con título y contador de tarjetas activas (`data-testid="total-cards-badge"`).
  - `Column.tsx`: Representa una columna con edición en línea de su título (`Enter`, `Escape`, `onBlur`), zona `Droppable` de tarjetas y botón para abrir el modal de nueva tarjeta.
  - `CardItem.tsx`: Tarjeta `Draggable` con indicador de arrastre, título, detalles opcionales y botón para eliminar tarjeta.
  - `NewCardModal.tsx`: Modal con validación de título obligatorio para crear una nueva tarjeta en una columna específica.

## Paleta de Colores (`tailwind.config.ts`)

- `accent-yellow`: `#ecad0a`
- `primary-blue`: `#209dd7`
- `secondary-purple`: `#753991`
- `dark-navy`: `#032147`
- `text-gray`: `#888888`

## Scripts y Pruebas Existentes

- `npm run dev`: Inicia el servidor de desarrollo en `http://localhost:3000`.
- `npm run build`: Compila la aplicación Next.js.
- `npm test`: Ejecuta pruebas unitarias con Vitest (`tests/unit/useKanban.test.ts` y `tests/unit/Board.test.tsx`).
- `npm run test:e2e`: Ejecuta pruebas de extremo a extremo con Playwright (`tests/e2e/kanban.spec.ts`), validando renderizado de las 5 columnas, renombrado de columnas, creación, eliminación y arrastre de tarjetas entre columnas.

## Pendientes frente a los Requisitos del MVP

- Configurar exportación estática (`output: "export"`) para ser servida por FastAPI en `/`.
- Añadir edición manual de tarjetas existentes (título y detalles).
- Añadir pantalla de inicio de sesión (`user` / `password`) y cierre de sesión.
- Conectar estado del tablero con la API persistente del backend (SQLite).
- Añadir barra lateral de chat con IA sincronizada con el tablero Kanban.

