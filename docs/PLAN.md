# Plan de Ejecución del Proyecto - Gestor de Proyectos Kanban MVP

Este documento detalla los pasos de implementación, pruebas y criterios de éxito para construir y empaquetar el MVP completo según las especificaciones de `AGENTS.md`.

---

## Parte 1: Planificación

Enriquecer este documento con subpasos detallados en listas de verificación, pruebas y criterios de éxito para cada parte, documentar el código existente del frontend en `frontend/AGENTS.md` y obtener la aprobación del usuario antes de implementar.

### Lista de verificación
- [x] 1.1 Revisar `AGENTS.md`, `docs/PLAN.md` y la estructura actual del repositorio (`frontend/`, `backend/`, `scripts/`, `.env`).
- [x] 1.2 Aclarar discrepancias con el usuario (uso de Google Gemini `gemini-3.8-flash`, credenciales `user`/`password`, inclusión de edición manual de tarjetas y esquema SQLite con JSON por usuario).
- [x] 1.3 Crear `frontend/AGENTS.md` describiendo la arquitectura, componentes, hooks, tipos, estilos y pruebas existentes.
- [x] 1.4 Enriquecer `docs/PLAN.md` con subpasos, pruebas y criterios de éxito para las Partes 1 a 10.
- [x] 1.5 Obtener revisión y aprobación del usuario sobre este plan.

### Pruebas y validación
- Verificar que `frontend/AGENTS.md` refleja fielmente todos los archivos bajo `frontend/src/` y `frontend/tests/`.
- Verificar que ningún documento contenga emojis y respete las decisiones técnicas de `AGENTS.md`.

### Criterios de éxito
- `docs/PLAN.md` y `frontend/AGENTS.md` creados, completos y aprobados explícitamente por el usuario antes de iniciar la Parte 2.

---

## Parte 2: Estructura

Configurar la infraestructura de Docker, el backend en `backend/` con FastAPI gestionado con `uv`, y los scripts de inicio y parada en `scripts/`. Servir inicialmente un HTML estático de ejemplo en `/` que confirme funcionamiento local y realice una llamada a la API.

### Lista de verificación
- [x] 2.1 Inicializar proyecto Python en `backend/pyproject.toml` para gestión con `uv` (dependencias: `fastapi`, `uvicorn[standard]`, `python-dotenv`; desarrollo: `pytest`, `httpx`).
- [x] 2.2 Crear `backend/app/main.py` con rutas `GET /api/health` y `GET /api/hello`, y montaje estático inicial (`backend/static/index.html`) en `/` que muestre "Hola Mundo" y consulte `GET /api/hello` mediante `fetch`.
- [x] 2.3 Crear `Dockerfile` en la raíz usando `uv` para instalar dependencias, exponiendo el puerto `8000` y ejecutando Uvicorn en `0.0.0.0:8000`, junto con `.dockerignore`.
- [x] 2.4 Crear scripts de inicio y parada para Windows, Mac y Linux en `scripts/`:
  - `scripts/start.ps1` y `scripts/stop.ps1` (Windows PowerShell)
  - `scripts/start.bat` y `scripts/stop.bat` (Windows CMD)
  - `scripts/start.sh` y `scripts/stop.sh` (Mac / Linux)
  Los scripts construirán/ejecutarán el contenedor cargando `.env`, mapeando el puerto `8000` y montando un volumen/directorio `data/` para persistir SQLite.
- [x] 2.5 Actualizar `backend/AGENTS.md` y `scripts/AGENTS.md` con la descripción de los componentes creados.

### Pruebas
- Pruebas unitarias en `backend/tests/test_health.py` ejecutadas con `pytest` validando códigos `200`, JSON en `/api/health` y `/api/hello`, y entrega de HTML en `/`.
- Prueba de integración ejecutando el script de inicio local, verificando respuesta HTTP en `http://localhost:8000/` y `http://localhost:8000/api/hello`, y deteniendo el contenedor con el script de parada.

### Criterios de éxito
- El contenedor Docker arranca y se detiene limpiamente con los scripts de `scripts/`.
- `http://localhost:8000/` sirve la página HTML estática y muestra la respuesta obtenida desde `/api/hello`.
- Todas las pruebas unitarias de backend pasan.

---

## Parte 3: Integración del frontend

Compilar el frontend Next.js de forma estática y servirlo desde FastAPI en `/`, incluyendo soporte completo de edición manual de tarjetas existentes además de las funciones actuales del tablero Kanban.

### Lista de verificación
- [x] 3.1 Actualizar `frontend/next.config.ts` con `output: "export"` para generar los archivos estáticos en `frontend/out/`.
- [x] 3.2 Añadir edición manual de tarjetas (título y detalles):
  - Agregar acción `editCard(cardId, title, details)` en `frontend/src/hooks/useKanban.ts`.
  - Añadir botón de edición en `CardItem.tsx` y soporte de modo edición/creación en el modal de tarjeta (`CardModal.tsx` o extensión limpia de `NewCardModal.tsx`) conectado a `Column.tsx` y `Board.tsx`.
- [x] 3.3 Actualizar `Dockerfile` a construcción multi-etapa:
  - Etapa 1 (`node:22-alpine`): instala dependencias de `frontend/` y ejecuta `npm run build` generando `frontend/out/`.
  - Etapa 2 (`python:3.12-slim` + `uv`): instala `backend/` y copia `frontend/out/` a `backend/static/` para ser servido por FastAPI con `StaticFiles(directory=..., html=True)` después de las rutas `/api/*`.

### Pruebas
- Pruebas unitarias de frontend (`npm test` con Vitest): ampliar `useKanban.test.ts` y `Board.test.tsx` para cubrir `editCard` y validación de título vacío al editar.
- Pruebas unitarias de backend (`pytest`): confirmar que `/api/health` responde JSON y `/` entrega el HTML exportado de Next.js.
- Pruebas E2E con Playwright (`kanban.spec.ts`): ejecutar contra la aplicación servida en Docker (`http://localhost:8000`) validando las 5 columnas, renombrado, creación, edición, eliminación y drag & drop de tarjetas.

### Criterios de éxito
- El contenedor Docker único compila el frontend y lo sirve en `http://localhost:8000/`.
- El usuario puede renombrar columnas y crear, editar, mover y eliminar tarjetas sin errores de consola ni rutas rotas.
- Suite completa de Vitest, pytest y Playwright en verde.

---

## Parte 4: Añadir una experiencia de inicio de sesión simulada

Requerir inicio de sesión con las credenciales fijas `user` y `password` al acceder a `/` por primera vez para visualizar el tablero Kanban, e incluir opción de cerrar sesión.

### Lista de verificación
- [x] 4.1 Implementar rutas de autenticación en el backend (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`) usando una cookie de sesión `HttpOnly` firmada simple, validando inicialmente `username == "user"` y `password == "password"`.
- [x] 4.2 Crear componente `frontend/src/components/LoginForm.tsx` aplicando la paleta de colores definida en `AGENTS.md` (`#032147` encabezados, `#753991` botón de ingreso, `#209dd7` focos/enlaces, `#ecad0a` acento superior, `#888888` etiquetas).
- [x] 4.3 Actualizar `Header.tsx` para mostrar el usuario autenticado y un botón "Cerrar sesión" (`data-testid="logout-btn"`).
- [x] 4.4 Actualizar `page.tsx` para consultar el estado de sesión al cargar: mostrar `LoginForm` si no hay sesión activa y mostrar `Board` únicamente tras autenticarse.

### Pruebas
- Pruebas unitarias de backend (`pytest`): login válido (`200` + cookie), credenciales inválidas (`401`), verificación de `/api/auth/me` con y sin sesión, y limpieza de sesión en `/api/auth/logout`.
- Pruebas unitarias de frontend (`Vitest`): renderizado de `LoginForm`, mensaje de error ante credenciales inválidas y transición al tablero al iniciar sesión.
- Pruebas E2E (`Playwright`): actualizar `beforeEach` de pruebas del tablero para iniciar sesión, y añadir suite `auth.spec.ts` probando bloqueo sin sesión, login fallido, login exitoso con `user`/`password`, persistencia tras recargar página y cierre de sesión.

### Criterios de éxito
- Ningún usuario no autenticado puede ver el tablero Kanban en `/`.
- Iniciar sesión con `user` y `password` muestra el tablero; cerrar sesión regresa inmediatamente a la vista de login.

---

## Parte 5: Modelado de la base de datos

Proponer el esquema de base de datos SQLite y el esquema JSON del tablero Kanban, documentarlos en `docs/` y obtener la aprobación del usuario antes de implementar las rutas de persistencia.

### Lista de verificación
- [x] 5.1 Definir esquema SQLite relacional simple preparado para múltiples usuarios:
  - Tabla `users`: `id` (INTEGER PK), `username` (TEXT UNIQUE NOT NULL), `password_hash` (TEXT NOT NULL), `created_at` (TEXT NOT NULL).
  - Tabla `boards`: `id` (INTEGER PK), `user_id` (INTEGER UNIQUE NOT NULL REFERENCES `users(id)`), `board_json` (TEXT NOT NULL), `updated_at` (TEXT NOT NULL).
- [x] 5.2 Crear `docs/kanban_schema.json` con el JSON Schema formal de `BoardData` (`columnOrder`, `columns`, `cards`) almacenado en `boards.board_json`.
- [x] 5.3 Crear `docs/DATABASE.md` explicando el diseño de tablas, relación usuario-tablero (1 tablero por usuario en MVP, extensible a múltiples usuarios/tableros), inicialización automática si el archivo SQLite no existe y datos semilla del usuario `user`.
- [x] 5.4 Presentar `docs/kanban_schema.json` y `docs/DATABASE.md` al usuario y obtener su aprobación antes de continuar a la Parte 6.

### Pruebas y validación
- Validar que el objeto `initialBoardData` cumple íntegramente con `docs/kanban_schema.json`.

### Criterios de éxito
- `docs/kanban_schema.json` y `docs/DATABASE.md` completados y aprobados por el usuario.

---

## Parte 6: Backend (Persistencia SQLite y API Kanban)

Implementar la capa SQLite con creación automática de base de datos y las rutas API para leer y modificar el tablero Kanban de un usuario autenticado.

### Lista de verificación
- [x] 6.1 Implementar `backend/app/db.py` usando `sqlite3` con creación automática del directorio/archivo (`DATABASE_PATH`, por defecto `data/pm.db`), creación de tablas `users` y `boards`, y creación idempotente del usuario `user` (contraseña hasheada) junto con su tablero Kanban por defecto al iniciar la aplicación (`lifespan`).
- [x] 6.2 Implementar modelos Pydantic en `backend/app/schemas.py` (`CardSchema`, `ColumnSchema`, `BoardDataSchema`) validando que `columnOrder` preserve las 5 columnas fijas y que todos los `cardIds` correspondan biunívocamente con las claves de `cards`.
- [x] 6.3 Actualizar las rutas de autenticación (`backend/app/auth.py`) para verificar credenciales contra la tabla `users` en SQLite y resolver el `user_id` de la sesión activa.
- [x] 6.4 Implementar endpoints protegidos:
  - `GET /api/board`: retorna el `BoardData` del usuario autenticado.
  - `PUT /api/board`: valida el `BoardDataSchema` recibido y actualiza `boards.board_json` y `updated_at` para ese usuario.

### Pruebas
- Pruebas unitarias exhaustivas en `backend/tests/test_board_api.py` con archivo SQLite temporal por prueba:
  - Creación automática del archivo `.db` cuando no existe.
  - Lectura inicial del tablero semilla tras login.
  - Actualización completa del tablero (renombrar columna, añadir, editar, mover y borrar tarjetas) y verificación de persistencia en lecturas posteriores.
  - Rechazo con `401` sin sesión activa y `422` ante JSON inconsistente (ej. `cardIds` huérfanos o columnas faltantes).
  - Aislamiento de datos creando un segundo usuario en BD y verificando que cada uno lee y modifica únicamente su propio tablero.

### Criterios de éxito
- Si el archivo SQLite no existe al arrancar, se crea e inicializa automáticamente sin intervención manual.
- `GET /api/board` y `PUT /api/board` funcionan con validación estricta y cobertura completa de pruebas unitarias.

---

## Parte 7: Frontend + Backend

Conectar el frontend con la API del backend para que todas las operaciones sobre el tablero Kanban sean persistentes en SQLite.

### Lista de verificación
- [x] 7.1 Crear módulo cliente `frontend/src/lib/api.ts` con funciones tipadas para autenticación (`login`, `logout`, `getMe`) y tablero (`fetchBoard`, `saveBoard`).
- [x] 7.2 Actualizar `frontend/src/hooks/useKanban.ts` para:
  - Cargar el tablero inicial desde `GET /api/board` al autenticarse.
  - Aplicar actualizaciones optimistas en las acciones `renameColumn`, `addCard`, `editCard`, `deleteCard` y `moveCard`, persistiendo cada cambio mediante `PUT /api/board`.
  - Exponer `replaceBoard(newBoard)` para actualizaciones externas (como respuestas de IA en la Parte 10), estado `isLoading` y mensaje `error` en caso de fallo de red.
- [x] 7.3 Mostrar estado de carga limpio y aviso discreto si ocurre un error de sincronización en `Board.tsx`.

### Pruebas
- Pruebas unitarias de frontend (`Vitest`): mockear llamadas `fetch` a `/api/board` verificando carga inicial, disparo de `PUT /api/board` en cada operación del usuario y manejo de errores HTTP.
- Pruebas de integración E2E (`Playwright`) contra el contenedor Docker con SQLite real: iniciar sesión, renombrar una columna, crear una tarjeta, editar otra, eliminar una y arrastrar otra de columna; recargar la página (`page.reload()`) y cerrar/abrir sesión confirmando que todos los cambios persisten.

### Criterios de éxito
- El tablero Kanban es 100% persistente entre recargas del navegador y reinicios del contenedor (gracias al volumen de datos en `scripts/`).

---

## Parte 8: Conectividad con IA

Configurar la integración del backend con Google Gemini (`gemini-3.8-flash`) usando el SDK oficial `google-genai` y `GEMINI_API_KEY` desde `.env`, verificando la conectividad real.
*(Nota: Se utiliza Google Gemini según lo establecido en `AGENTS.md` en lugar de OpenRouter).*

### Lista de verificación
- [ ] 8.1 Consultar la documentación actualizada del SDK `google-genai` para `gemini-3.8-flash` (Interactions API y salidas estructuradas) antes de escribir el código.
- [ ] 8.2 Añadir dependencia `google-genai` (>= `2.30.1`) en `backend/pyproject.toml` con `uv` y asegurar que `.env` se inyecte tanto en ejecución local como en el contenedor Docker.
- [ ] 8.3 Crear `backend/app/ai.py` con cliente Gemini inicializado a partir de `GEMINI_API_KEY` y función de consulta simple con el modelo `gemini-3.8-flash`.

### Pruebas
- Prueba unitaria en `backend/tests/test_ai_connectivity.py` mockeando el cliente del SDK para validar configuración de modelo (`gemini-3.8-flash`) y manejo de falta de API key.
- Prueba de integración real (ejecutada con la `GEMINI_API_KEY` de `.env`) enviando `"¿Cuánto es 2+2? Responde únicamente con el número."` y comprobando que la respuesta contiene `"4"`.

### Criterios de éxito
- El backend en local y dentro del contenedor Docker se comunica exitosamente con `gemini-3.8-flash` usando `GEMINI_API_KEY`.

---

## Parte 9: Chat con IA y Salidas Estructuradas en el Backend

Ampliar el servicio de IA para recibir el JSON actual del tablero Kanban, el mensaje del usuario y el historial de conversación, devolviendo Salidas Estructuradas con la respuesta textual y, opcionalmente, el tablero Kanban actualizado.

### Lista de verificación
- [ ] 9.1 Definir esquemas Pydantic en `backend/app/schemas.py`:
  - `ChatMessage` (`role`: `"user" | "assistant"`, `content`: `str`)
  - `ChatRequest` (`message`: `str`, `history`: `list[ChatMessage] = []`)
  - `AIChatOutput` (`reply`: `str`, `updated_board`: `BoardDataSchema | None = None`)
- [ ] 9.2 Implementar en `backend/app/ai.py` la llamada a `gemini-3.8-flash` con Salidas Estructuradas (`AIChatOutput`) e instrucciones de sistema claras:
  - Incluir siempre el JSON vigente del tablero del usuario y el historial de conversación.
  - Si el usuario solo hace una pregunta o conversa, responder en `reply` y devolver `updated_board = null`.
  - Si el usuario solicita crear, editar, mover, eliminar tarjetas o renombrar columnas (una o varias acciones a la vez), devolver en `updated_board` el estado completo consistente del tablero manteniendo las 5 columnas en `columnOrder`.
- [ ] 9.3 Crear endpoint `POST /api/chat` autenticado:
  - Obtiene el tablero actual del usuario desde SQLite.
  - Invoca al servicio Gemini.
  - Si `updated_board` no es nulo, valida integridad con `BoardDataSchema` y guarda el nuevo tablero en SQLite automáticamente.
  - Retorna `{ "reply": ..., "updated_board": ... }`.

### Pruebas
- Pruebas unitarias en `backend/tests/test_chat_api.py` (con mocks del SDK Gemini):
  - Consulta informativa sobre el tablero devuelve `reply` sin modificar SQLite (`updated_board: None`).
  - Solicitud de cambio devuelve `updated_board` y persiste los cambios en SQLite.
  - Envío y propagación correcta del historial de conversación multi-turno.
  - Manejo seguro si el modelo devuelve un tablero inválido o error de API sin corromper los datos guardados.
- Prueba de integración real contra `gemini-3.8-flash` verificando: (1) pregunta sobre cuántas tarjetas hay en una columna (`updated_board` nulo) y (2) orden de crear y mover una tarjeta (`updated_board` poblado, válido y persistido).

### Criterios de éxito
- `POST /api/chat` devuelve siempre JSON estructurado válido, respeta el contexto conversacional y actualiza SQLite cuando corresponde.

---

## Parte 10: Barra lateral de Chat con IA en el Frontend

Añadir un widget lateral en la interfaz de usuario para chatear con la IA y reflejar automáticamente en el tablero cualquier actualización del Kanban devuelta por el modelo.

### Lista de verificación
- [ ] 10.1 Añadir función `sendChatMessage(message, history)` en `frontend/src/lib/api.ts`.
- [ ] 10.2 Crear componente `frontend/src/components/ChatSidebar.tsx` siguiendo la paleta de colores del proyecto:
  - Panel lateral colapsable/expandible integrado limpiamente junto al tablero Kanban.
  - Lista desplazable de mensajes (usuario y asistente), estado "Pensando..." durante la petición y manejo claro de errores.
  - Campo de entrada con envío mediante `Enter` y botón de acción en púrpura secundario (`#753991`).
- [ ] 10.3 Integrar `ChatSidebar` en `Board.tsx`: cuando la respuesta de `POST /api/chat` incluya `updated_board`, invocar `replaceBoard(response.updated_board)` para actualizar el tablero instantáneamente sin recargar.
- [ ] 10.4 Redactar un `README.md` conciso en la raíz (requisitos, `.env`, cómo iniciar/detener con `scripts/` y cómo ejecutar pruebas) y actualizar `backend/AGENTS.md` y `frontend/AGENTS.md` con el estado final, verificando ausencia total de emojis.

### Pruebas
- Pruebas unitarias de frontend (`Vitest`):
  - `ChatSidebar.test.tsx`: envío de mensajes, historial en pantalla, estado deshabilitado mientras carga y notificación de `onBoardUpdate` cuando llega `updated_board`.
  - Integración en `Board.test.tsx`: confirmar que una respuesta del chat con `updated_board` actualiza las tarjetas renderizadas inmediatamente.
- Pruebas E2E completas (`Playwright`) contra el contenedor Docker en ejecución:
  - Flujo completo: iniciar sesión (`user`/`password`), abrir la barra lateral de chat, pedir a la IA crear una nueva tarjeta en una columna específica y mover otra tarjeta, verificar que el tablero Kanban se actualiza automáticamente en la UI y persiste tras recargar la página.

### Criterios de éxito
- El usuario cuenta con la aplicación completa empaquetada en Docker: login, tablero Kanban con renombrado de columnas, creación/edición/eliminación/drag-and-drop de tarjetas persistente en SQLite, y chat lateral con Gemini `gemini-3.8-flash` capaz de actualizar una o más tarjetas en vivo.
- Todas las pruebas unitarias y E2E de backend y frontend pasan sin errores.
