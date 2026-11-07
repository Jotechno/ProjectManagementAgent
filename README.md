# Gestor de Proyectos Kanban MVP

Aplicación de gestión de proyectos con tablero Kanban interactivo, persistencia en SQLite y asistente de IA integrado mediante Google Gemini (`gemini-3.8-flash`). El frontend (Next.js estático) y el backend (FastAPI) se empaquetan y sirven desde un único contenedor Docker en `http://localhost:8000`.

## Características principales

- Inicio de sesión con sesión firmada (`HttpOnly` cookie). Credenciales por defecto: usuario `user`, contraseña `password`.
- Tablero Kanban con 5 columnas fijas renombrables.
- Creación, edición, eliminación y movimiento (`drag and drop`) de tarjetas sincronizados con SQLite.
- Barra lateral de chat con IA (`gemini-3.8-flash`) capaz de responder preguntas y crear, editar, mover o eliminar tarjetas del tablero en tiempo real.

## Requisitos

- Docker instalado y en ejecución.
- Archivo `.env` en la raíz del proyecto con la clave de API de Gemini:

```env
GEMINI_API_KEY=tu_clave_de_gemini
```

## Inicio y detención del servidor

### Windows (CMD o PowerShell)

```bat
scripts\start.bat
scripts\stop.bat
```

O directamente con PowerShell:

```powershell
.\scripts\start.ps1
.\scripts\stop.ps1
```

### macOS y Linux

```bash
./scripts/start.sh
./scripts/stop.sh
```

Una vez iniciado el contenedor (`pm-kanban-app`), la aplicación estará disponible en `http://localhost:8000` y la base de datos SQLite se persistirá en `./data/pm.db`.

## Ejecución de pruebas

### Pruebas unitarias de frontend (Vitest)

```bash
cd frontend
npm test
```

### Pruebas unitarias e integración de backend (Pytest en contenedor)

```bash
docker exec pm-kanban-app pytest -k "not test_real_gemini"
```

Para incluir las pruebas contra el servicio en vivo de Gemini:

```bash
docker exec pm-kanban-app pytest
```

### Pruebas E2E (Playwright contra el contenedor en `http://localhost:8000`)

```bash
cd frontend
PLAYWRIGHT_BASE_URL=http://localhost:8000 npm run test:e2e
```
