#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="pm-kanban-app"

if [ -n "$(docker ps -aq -f "name=^${CONTAINER_NAME}$")" ]; then
  echo "Deteniendo y eliminando contenedor ${CONTAINER_NAME}..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null
  echo "Servidor detenido."
else
  echo "El contenedor ${CONTAINER_NAME} no esta en ejecucion."
fi

