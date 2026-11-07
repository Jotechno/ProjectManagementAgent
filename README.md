# Gestor de Proyectos Kanban

Aplicación MVP para organizar proyectos en un tablero Kanban. Incluye una interfaz Next.js y un backend FastAPI, empaquetados en Docker.

## Funcionalidades disponibles

- Inicio de sesión de demostración.
- Tablero Kanban con columnas renombrables.
- Creación, edición, eliminación y movimiento de tarjetas.

La autenticación utiliza las credenciales `user` y `password`. El tablero todavía no se guarda de forma persistente. La integración con SQLite y el chat con IA están pendientes.

## Requisitos

- Docker
- Docker Compose no es necesario

## Inicio y parada

En Windows, desde la raíz del proyecto:

```bat
scripts\start.bat
scripts\stop.bat
```

En macOS o Linux:

```bash
bash scripts/start.sh
bash scripts/stop.sh
```

La aplicación estará disponible en <http://localhost:8000>. Los scripts cargan el archivo `.env` si existe; la clave de Gemini no es necesaria para iniciar la versión actual.

## Pruebas

Frontend:

```bash
cd frontend
npm test
```

Backend:

```bash
cd backend
uv run pytest
```
