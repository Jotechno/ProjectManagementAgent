# Enfoque y Modelado de Base de Datos (Parte 5)

## Resumen

La aplicación utiliza una base de datos **SQLite** local almacenada en `DATABASE_PATH` (por defecto `/app/data/pm.db` dentro del contenedor Docker, montada en `./data/pm.db` en el host). Si el archivo de base de datos no existe al iniciar el backend, se crea e inicializa de forma automática.

El modelo combina:
1. **Estructura relacional para usuarios y propiedad de tableros** (`users` y `boards`), preparando el sistema para múltiples usuarios en el futuro.
2. **Documento JSON validado (`board_json`) para el estado del tablero Kanban**, cuyo contrato formal está definido en `docs/kanban_schema.json`.

---

## Esquema SQL (SQLite)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    board_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Detalles de las tablas

- **`users`**:
  - `id`: Identificador único autoincremental.
  - `username`: Nombre de usuario único (para el MVP se inicializa con `user`).
  - `password_hash`: Hash seguro de contraseña generado con `hashlib.pbkdf2_hmac` (SHA-256 + sal aleatoria), evitando almacenar contraseñas en texto plano.
  - `created_at`: Marca de tiempo UTC en formato ISO 8601.
- **`boards`**:
  - `id`: Identificador único del tablero.
  - `user_id`: Clave foránea hacia `users(id)` con restricción `UNIQUE` para cumplir la regla del MVP de **1 tablero Kanban por usuario** (si en el futuro se requieren múltiples tableros por usuario, basta retirar la restricción `UNIQUE` y añadir una columna `name`).
  - `board_json`: Cadena JSON que cumple con `docs/kanban_schema.json` (`columnOrder`, `columns`, `cards`).
  - `updated_at`: Marca de tiempo UTC ISO 8601 de la última modificación.

---

## Reglas de Integridad del JSON del Tablero

Además de la estructura definida en `docs/kanban_schema.json`, el backend valida mediante Pydantic (`BoardDataSchema`) antes de cualquier escritura en SQLite (tanto desde la UI como desde la IA):

1. `columnOrder` contiene exactamente las 5 columnas fijas (`col-1` a `col-5`) sin duplicados.
2. Las claves de `columns` coinciden exactamente con los identificadores en `columnOrder`, y cada `columns[k].id == k`.
3. Ningún `title` de columna o tarjeta puede quedar vacío tras eliminar espacios.
4. Cada `cardId` listado en `columns[*].cardIds` existe en `cards`, no aparece duplicado en más de una columna, y toda clave presente en `cards` pertenece exactamente a una columna (sin tarjetas huérfanas).

---

## Inicialización Automática y Semilla (Seed)

Durante el evento `lifespan` de arranque de FastAPI:
1. Se asegura la existencia del directorio padre de `DATABASE_PATH`.
2. Se ejecutan las sentencias `CREATE TABLE IF NOT EXISTS`.
3. Si el usuario `user` no existe en `users`, se inserta con el hash correspondiente a `password` y se crea su registro en `boards` con las 5 columnas fijas (`Backlog`, `Por Hacer`, `En Progreso`, `En Revisión`, `Completado`) y las 7 tarjetas iniciales de demostración.

