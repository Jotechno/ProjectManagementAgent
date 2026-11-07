FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    DATABASE_PATH=/app/data/pm.db

WORKDIR /app/backend

COPY backend/pyproject.toml ./
RUN uv sync --no-dev

COPY backend/ ./
RUN rm -rf /app/backend/static
COPY --from=frontend-builder /app/frontend/out /app/backend/static
RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uv", "run", "--no-dev", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
