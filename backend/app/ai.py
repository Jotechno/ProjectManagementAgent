import json
import os
from typing import Any
from google import genai
from app.schemas import AIChatOutput, BoardDataSchema, ChatMessage

GEMINI_MODEL = "gemini-3.8-flash"

SYSTEM_PROMPT = """Eres un asistente experto de gestión de proyectos integrado en un tablero Kanban.
Responde siempre en español de forma clara y concisa.

Recibirás:
1. El estado actual del tablero Kanban en formato JSON (con `columnOrder`, `columns` y `cards`).
2. El historial reciente de la conversación.
3. El nuevo mensaje del usuario.

Reglas estrictas para tu salida JSON (`AIChatOutput`):
- `reply`: Tu respuesta en español para el usuario explicando la información solicitada o los cambios aplicados.
- `updated_board`:
  - Si el usuario solo hace una pregunta, consulta el estado del tablero o conversa sin pedir modificaciones, establece `updated_board` en `null`.
  - Si el usuario solicita crear, editar, mover o eliminar una o más tarjetas, o renombrar alguna columna, devuelve en `updated_board` el objeto completo `BoardData` actualizado cumpliendo todas estas reglas:
    1. `columnOrder` DEBE mantenerse exactamente como `["col-1", "col-2", "col-3", "col-4", "col-5"]`.
    2. `columns` DEBE conservar exactamente las claves `"col-1"` a `"col-5"` donde cada `columns[id].id == id`.
    3. Toda tarjeta referenciada en cualquier `columns[colId].cardIds` DEBE existir en `cards` con `cards[cardId].id == cardId`.
    4. Toda clave en `cards` DEBE estar incluida exactamente una vez en la lista `cardIds` de una sola columna (sin tarjetas huérfanas ni duplicadas).
    5. Al crear una nueva tarjeta, genera un `id` único (por ejemplo `"card-8"`, `"card-9"`, etc. que no colisione con las existentes), agrégala al diccionario `cards` y añade su `id` al arreglo `cardIds` de la columna correspondiente.
"""


def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY no está configurada en el entorno.")
    return genai.Client(api_key=api_key)


def ask_gemini(prompt: str, client: Any | None = None) -> str:
    active_client = client if client is not None else get_gemini_client()
    interaction = active_client.interactions.create(
        model=GEMINI_MODEL,
        input=prompt,
    )
    return (interaction.output_text or "").strip()


def build_kanban_chat_prompt(
    board: BoardDataSchema | dict[str, Any],
    message: str,
    history: list[ChatMessage] | None = None,
) -> str:
    board_dict = (
        board.model_dump() if isinstance(board, BoardDataSchema) else board
    )
    board_json = json.dumps(board_dict, ensure_ascii=False, indent=2)

    history_lines: list[str] = []
    for item in history or []:
        speaker = "Usuario" if item.role == "user" else "Asistente"
        history_lines.append(f"{speaker}: {item.content}")
    history_block = (
        "\n".join(history_lines)
        if history_lines
        else "(Sin mensajes previos)"
    )

    return (
        f"ESTADO ACTUAL DEL TABLERO KANBAN (JSON):\n{board_json}\n\n"
        f"HISTORIAL DE CONVERSACIÓN:\n{history_block}\n\n"
        f"MENSAJE DEL USUARIO:\n{message}"
    )


def chat_with_kanban(
    board: BoardDataSchema | dict[str, Any],
    message: str,
    history: list[ChatMessage] | None = None,
    client: Any | None = None,
) -> AIChatOutput:
    active_client = client if client is not None else get_gemini_client()
    prompt = build_kanban_chat_prompt(board=board, message=message, history=history)

    interaction = active_client.interactions.create(
        model=GEMINI_MODEL,
        system_instruction=SYSTEM_PROMPT,
        input=prompt,
        generation_config={"thinking_level": "low"},
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": AIChatOutput.model_json_schema(),
        },
    )

    raw_text = (interaction.output_text or "").strip()
    if not raw_text:
        raise ValueError("El modelo devolvió una respuesta vacía.")

    return AIChatOutput.model_validate_json(raw_text)
