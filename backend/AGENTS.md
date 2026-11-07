# Backend - FastAPI

## Resumen

Servicio backend en Python construido con FastAPI y gestionado mediante `uv` dentro del contenedor Docker. Expone endpoints bajo `/api/*` y sirve el contenido estático del frontend en `/`.

## Estructura Actual (Parte 2)

- `pyproject.toml`: Configuración del proyecto y dependencias gestionadas por `uv` (`fastapi`, `uvicorn[standard]`, `python-dotenv`, y grupo `dev` con `pytest` y `httpx`).
- `app/main.py`: Aplicación FastAPI con carga de `.env`, rutas `GET /api/health` y `GET /api/hello`, y montaje de archivos estáticos desde `backend/static` en `/`.
- `static/index.html`: Página HTML estática inicial de verificación ("Hola Mundo") que consulta `/api/hello`.
- `tests/test_health.py`: Pruebas unitarias con `TestClient` para `/api/health`, `/api/hello` y `/`.
