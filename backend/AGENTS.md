# Backend - FastAPI

## Resumen

Servicio backend en Python 3.12 construido con FastAPI y gestionado mediante `uv` dentro del contenedor Docker. Expone la API REST bajo `/api/*`, gestiona la persistencia en SQLite, integra Google Gemini (`gemini-3.8-flash`) mediante `google-genai` y sirve la compilación estática de Next.js en `/`.

## Estructura del Código

- `pyproject.toml`: Configuración del proyecto y dependencias gestionadas por `uv` (`fastapi`, `uvicorn[standard]`, `python-dotenv`, `google-genai>=2.30.1`, y grupo `dev` con `pytest` y `httpx`).
- `app/main.py`: Punto de entrada FastAPI, ciclo de vida (`lifespan`) que inicializa SQLite, endpoints `/api/health` y `/api/hello`, registro de routers (`auth`, `board`, `chat`) y montaje de archivos estáticos en `/`.
- `app/db.py`: Gestión de SQLite (`DATABASE_PATH`, por defecto `data/pm.db`). Crea automáticamente las tablas `users` y `boards`, aplica hash `PBKDF2-HMAC-SHA256` y siembra el usuario inicial (`user` / `password`) junto con el tablero por defecto (`INITIAL_BOARD_DATA`).
- `app/schemas.py`: Esquemas Pydantic (`CardSchema`, `ColumnSchema`, `BoardDataSchema`, `ChatMessage`, `ChatRequest`, `AIChatOutput`) con validación de invariantes del tablero Kanban (5 columnas fijas `col-1`..`col-5` y consistencia referencial de `cardIds`).
- `app/auth.py`: Autenticación basada en cookie `HttpOnly` firmada con `HMAC-SHA256` (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`) y dependencia `get_current_user`.
- `app/board.py`: Endpoints protegidos `GET /api/board` y `PUT /api/board` para leer y guardar el estado completo del tablero Kanban del usuario autenticado.
- `app/ai.py`: Cliente del SDK oficial `google-genai` (`client.interactions.create`) con el modelo `gemini-3.8-flash`, `thinking_level: "low"` y salidas estructuradas JSON (`AIChatOutput`).
- `app/chat.py`: Endpoint protegido `POST /api/chat` que envía el estado actual del tablero y el historial a Gemini, valida y persiste `updated_board` en SQLite cuando hay cambios y devuelve `{ reply, updated_board }`.
- `tests/`: Suite de pruebas con `pytest` (`conftest.py`, `test_health.py`, `test_auth.py`, `test_board_api.py`, `test_ai_connectivity.py`, `test_chat_api.py`).
