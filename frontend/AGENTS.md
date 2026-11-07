# Frontend - Tablero Kanban Next.js

## Resumen

Aplicación web cliente construida con Next.js 15 (App Router, compilada con `output: "export"`), React 19 y TypeScript 5.7. Se conecta a la API FastAPI para autenticación, persistencia del tablero Kanban en SQLite y chat interactivo con IA (`gemini-3.8-flash`).

## Stack Tecnológico

- **Framework**: Next.js `^15.2.0` con React `^19.0.0` (`output: "export"`)
- **Estilos**: Tailwind CSS `^3.4.17` y variables CSS globales
- **Drag and Drop**: `@hello-pangea/dnd` `^18.0.1`
- **Iconos**: `lucide-react` `^0.475.0`
- **Pruebas Unitarias**: Vitest `^3.0.5`, React Testing Library y `jsdom`
- **Pruebas E2E**: Playwright `^1.50.0` (Chromium)

## Estructura del Código

- `src/app/`
  - `layout.tsx`: Layout raíz en español (`lang="es"`) y metadatos de la aplicación.
  - `page.tsx`: Controla el estado de sesión (`getMe`, `login`, `logout`, `fetchBoard`), mostrando `LoginForm` cuando no hay sesión o `Board` con los datos persistidos del usuario autenticado.
  - `globals.css`: Directivas de Tailwind y variables CSS de la paleta corporativa.
- `src/types/kanban.ts`
  - Define las interfaces principales: `Card`, `Column`, `BoardData`, `DragLocation`, `ChatMessage` y `ChatResponse`.
- `src/lib/api.ts`
  - Cliente HTTP hacia el backend FastAPI: `getMe`, `login`, `logout`, `fetchBoard`, `saveBoard` y `sendChatMessage`.
- `src/data/initialData.ts`
  - Define `initialBoardData` con las 5 columnas fijas (`col-1` a `col-5`) y 7 tarjetas iniciales de respaldo.
- `src/hooks/useKanban.ts`
  - Hook personalizado que administra el estado `BoardData`, sincroniza mutaciones con `PUT /api/board` (`saveBoard`) y expone `loadBoard`, `replaceBoard`, `renameColumn`, `addCard`, `editCard`, `deleteCard` y `moveCard`.
- `src/components/`
  - `LoginForm.tsx`: Formulario de inicio de sesión con manejo de errores de credenciales.
  - `Board.tsx`: Contenedor principal del tablero Kanban y la barra lateral `ChatSidebar`. Sincroniza las actualizaciones devueltas por la IA mediante `replaceBoard`.
  - `Header.tsx`: Barra superior con título, contador de tarjetas activas, usuario activo y botón para cerrar sesión.
  - `Column.tsx`: Columna Kanban con renombrado en línea, zona `Droppable` y botón para añadir tarjetas.
  - `CardItem.tsx`: Tarjeta `Draggable` con acciones para editar y eliminar.
  - `NewCardModal.tsx`: Modal reutilizable para crear nuevas tarjetas o editar título y detalles de tarjetas existentes.
  - `ChatSidebar.tsx`: Barra lateral colapsable de chat con IA (`POST /api/chat`) con historial de mensajes, indicador `"Pensando..."`, manejo de errores y actualización en tiempo real del tablero.

## Paleta de Colores (`tailwind.config.ts`)

- `accent-yellow`: `#ecad0a`
- `primary-blue`: `#209dd7`
- `secondary-purple`: `#753991`
- `dark-navy`: `#032147`
- `text-gray`: `#888888`

## Scripts y Pruebas

- `npm run dev`: Inicia el servidor de desarrollo de Next.js.
- `npm run build`: Genera la exportación estática en `frontend/out/`.
- `npm test`: Ejecuta pruebas unitarias con Vitest (`useKanban.test.ts`, `Board.test.tsx`, `Auth.test.tsx`, `ChatSidebar.test.tsx`).
- `npm run test:e2e`: Ejecuta pruebas E2E con Playwright (`auth.spec.ts` y `kanban.spec.ts`).
