from datetime import datetime, timezone
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import sqlite3
from typing import Any

DEFAULT_DB_PATH = Path(__file__).resolve().parents[2] / "data" / "pm.db"

INITIAL_BOARD_DATA: dict[str, Any] = {
    "columnOrder": ["col-1", "col-2", "col-3", "col-4", "col-5"],
    "columns": {
        "col-1": {
            "id": "col-1",
            "title": "Backlog",
            "cardIds": ["card-1", "card-2"],
        },
        "col-2": {
            "id": "col-2",
            "title": "Por Hacer",
            "cardIds": ["card-3", "card-4"],
        },
        "col-3": {
            "id": "col-3",
            "title": "En Progreso",
            "cardIds": ["card-5"],
        },
        "col-4": {
            "id": "col-4",
            "title": "En Revisión",
            "cardIds": ["card-6"],
        },
        "col-5": {
            "id": "col-5",
            "title": "Completado",
            "cardIds": ["card-7"],
        },
    },
    "cards": {
        "card-1": {
            "id": "card-1",
            "title": "Definir arquitectura de microservicios",
            "details": "Evaluar límites de dominio y contratos de comunicación entre servicios principales.",
        },
        "card-2": {
            "id": "card-2",
            "title": "Auditoría de accesibilidad",
            "details": "Revisar contraste de colores y navegación por teclado según estándares WCAG 2.1 AA.",
        },
        "card-3": {
            "id": "card-3",
            "title": "Diseñar sistema de diseño corporativo",
            "details": "Estandarizar paleta de colores, tipografía y componentes base para la aplicación.",
        },
        "card-4": {
            "id": "card-4",
            "title": "Configurar pipeline de integración continua",
            "details": "Automatizar ejecución de pruebas unitarias y de integración en cada despliegue.",
        },
        "card-5": {
            "id": "card-5",
            "title": "Implementar tablero Kanban interactivo",
            "details": "Desarrollar soporte de arrastrar y soltar fluido entre las cinco columnas del flujo.",
        },
        "card-6": {
            "id": "card-6",
            "title": "Optimización de tiempos de carga",
            "details": "Reducir el tamaño del paquete de cliente y optimizar el renderizado de componentes.",
        },
        "card-7": {
            "id": "card-7",
            "title": "Levantamiento de requerimientos del MVP",
            "details": "Documentar el alcance funcional, criterios de aceptación y restricciones técnicas.",
        },
    },
}


def get_db_path() -> Path:
    env_path = os.getenv("DATABASE_PATH")
    return Path(env_path) if env_path else DEFAULT_DB_PATH


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str, salt: str | None = None) -> str:
    salt_hex = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt_hex.encode("utf-8"),
        100_000,
    ).hex()
    return f"{salt_hex}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    if "$" not in stored_hash:
        return False
    salt_hex, _ = stored_hash.split("$", 1)
    candidate = hash_password(password, salt=salt_hex)
    return hmac.compare_digest(candidate, stored_hash)


def _connect_raw(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    db_path = get_db_path()
    with _connect_raw(db_path) as conn:
        conn.executescript(
            """
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
            """
        )
        _ensure_user_with_default_board(conn, "user", "password")


def _ensure_user_with_default_board(
    conn: sqlite3.Connection, username: str, password: str
) -> int:
    row = conn.execute(
        "SELECT id FROM users WHERE username = ?", (username,)
    ).fetchone()
    now = _utc_now()
    if row is None:
        cursor = conn.execute(
            "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
            (username, hash_password(password), now),
        )
        user_id = int(cursor.lastrowid)
    else:
        user_id = int(row["id"])

    board_row = conn.execute(
        "SELECT id FROM boards WHERE user_id = ?", (user_id,)
    ).fetchone()
    if board_row is None:
        conn.execute(
            "INSERT INTO boards (user_id, board_json, updated_at) VALUES (?, ?, ?)",
            (user_id, json.dumps(INITIAL_BOARD_DATA, ensure_ascii=False), now),
        )
    return user_id


def get_connection() -> sqlite3.Connection:
    init_db()
    return _connect_raw(get_db_path())


def create_user(username: str, password: str) -> int:
    with get_connection() as conn:
        return _ensure_user_with_default_board(conn, username, password)


def authenticate_user(username: str, password: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, username, password_hash FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        if row is None:
            return None
        if not verify_password(password, row["password_hash"]):
            return None
        return {"id": int(row["id"]), "username": str(row["username"])}


def get_user_by_username(username: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, username FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        if row is None:
            return None
        return {"id": int(row["id"]), "username": str(row["username"])}


def get_board_for_user(user_id: int) -> dict[str, Any]:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT board_json FROM boards WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        if row is None:
            now = _utc_now()
            conn.execute(
                "INSERT INTO boards (user_id, board_json, updated_at) VALUES (?, ?, ?)",
                (user_id, json.dumps(INITIAL_BOARD_DATA, ensure_ascii=False), now),
            )
            return json.loads(json.dumps(INITIAL_BOARD_DATA))
        return json.loads(row["board_json"])


def update_board_for_user(user_id: int, board_data: dict[str, Any]) -> dict[str, Any]:
    now = _utc_now()
    serialized = json.dumps(board_data, ensure_ascii=False)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO boards (user_id, board_json, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                board_json = excluded.board_json,
                updated_at = excluded.updated_at
            """,
            (user_id, serialized, now),
        )
    return board_data

