#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
IMAGE_NAME="pm-kanban:latest"
CONTAINER_NAME="pm-kanban-app"
DATA_DIR="${REPO_ROOT}/data"
ENV_FILE="${REPO_ROOT}/.env"

mkdir -p "${DATA_DIR}"

echo "Construyendo imagen Docker ${IMAGE_NAME}..."
docker build -t "${IMAGE_NAME}" "${REPO_ROOT}"

if [ -n "$(docker ps -aq -f "name=^${CONTAINER_NAME}$")" ]; then
  echo "Eliminando contenedor previo ${CONTAINER_NAME}..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null
fi

RUN_ARGS=(
  run -d
  --name "${CONTAINER_NAME}"
  -p 8000:8000
  -v "${DATA_DIR}:/app/data"
)

if [ -f "${ENV_FILE}" ]; then
  RUN_ARGS+=(--env-file "${ENV_FILE}")
fi

RUN_ARGS+=("${IMAGE_NAME}")

echo "Iniciando contenedor ${CONTAINER_NAME} en http://localhost:8000 ..."
docker "${RUN_ARGS[@]}" >/dev/null

for _ in $(seq 1 20); do
  if curl -fsS "http://localhost:8000/api/health" >/dev/null 2>&1; then
    echo "Servidor listo en http://localhost:8000"
    exit 0
  fi
  sleep 1
done

echo "El servidor no respondio a tiempo. Revisa los logs con: docker logs ${CONTAINER_NAME}" >&2
exit 1

