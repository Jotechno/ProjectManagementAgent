import copy
import json
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient
from app.ai import chat_with_kanban
from app.db import INITIAL_BOARD_DATA
from app.main import app
from app.schemas import BoardDataSchema, ChatMessage


def test_chat_endpoint_requires_authentication() -> None:
    client = TestClient(app)
    res = client.post("/api/chat", json={"message": "Hola"})
    assert res.status_code == 401


def test_chat_informational_reply_does_not_modify_board(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    mock_client = MagicMock()
    mock_interaction = MagicMock()
    mock_interaction.output_text = json.dumps(
        {
            "reply": "Actualmente tienes 2 tarjetas en la columna Backlog.",
            "updated_board": None,
        },
        ensure_ascii=False,
    )
    mock_client.interactions.create.return_value = mock_interaction
    monkeypatch.setattr("app.ai.get_gemini_client", lambda: mock_client)

    client = TestClient(app)
    client.post(
        "/api/auth/login",
        json={"username": "user", "password": "password"},
    )

    res = client.post(
        "/api/chat",
        json={
            "message": "¿Cuántas tarjetas hay en Backlog?",
            "history": [],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["reply"] == "Actualmente tienes 2 tarjetas en la columna Backlog."
    assert data["updated_board"] is None

    board_after = client.get("/api/board").json()
    assert board_after == INITIAL_BOARD_DATA


def test_chat_board_update_persists_in_sqlite_and_passes_history(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    modified_board = copy.deepcopy(INITIAL_BOARD_DATA)
    modified_board["cards"]["card-8"] = {
        "id": "card-8",
        "title": "Implementar métricas con IA",
        "details": "Creada por el asistente en prueba unitaria.",
    }
    modified_board["columns"]["col-1"]["cardIds"].append("card-8")

    mock_client = MagicMock()
    mock_interaction = MagicMock()
    mock_interaction.output_text = json.dumps(
        {
            "reply": "He agregado la tarjeta 'Implementar métricas con IA' en Backlog.",
            "updated_board": modified_board,
        },
        ensure_ascii=False,
    )
    mock_client.interactions.create.return_value = mock_interaction
    monkeypatch.setattr("app.ai.get_gemini_client", lambda: mock_client)

    client = TestClient(app)
    client.post(
        "/api/auth/login",
        json={"username": "user", "password": "password"},
    )

    res = client.post(
        "/api/chat",
        json={
            "message": "Agrega una tarjeta llamada Implementar métricas con IA en Backlog",
            "history": [
                {"role": "user", "content": "Hola asistente"},
                {"role": "assistant", "content": "Hola, ¿en qué puedo ayudarte?"},
            ],
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert "Implementar métricas con IA" in body["reply"]
    assert body["updated_board"] is not None
    assert "card-8" in body["updated_board"]["cards"]

    call_kwargs = mock_client.interactions.create.call_args.kwargs
    assert "Hola asistente" in call_kwargs["input"]
    assert "Definir arquitectura de microservicios" in call_kwargs["input"]

    persisted_board = client.get("/api/board").json()
    assert (
        persisted_board["cards"]["card-8"]["title"]
        == "Implementar métricas con IA"
    )
    assert "card-8" in persisted_board["columns"]["col-1"]["cardIds"]


def test_chat_invalid_ai_board_output_returns_502_and_preserves_db(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    corrupted_board = copy.deepcopy(INITIAL_BOARD_DATA)
    corrupted_board["cards"]["card-orphan"] = {
        "id": "card-orphan",
        "title": "Tarjeta sin columna",
        "details": "",
    }

    mock_client = MagicMock()
    mock_interaction = MagicMock()
    mock_interaction.output_text = json.dumps(
        {
            "reply": "Respuesta con tablero inválido",
            "updated_board": corrupted_board,
        },
        ensure_ascii=False,
    )
    mock_client.interactions.create.return_value = mock_interaction
    monkeypatch.setattr("app.ai.get_gemini_client", lambda: mock_client)

    client = TestClient(app)
    client.post(
        "/api/auth/login",
        json={"username": "user", "password": "password"},
    )

    res = client.post(
        "/api/chat",
        json={"message": "Intenta romper el tablero", "history": []},
    )
    assert res.status_code == 502

    persisted_board = client.get("/api/board").json()
    assert persisted_board == INITIAL_BOARD_DATA


def test_real_gemini_structured_chat_creates_and_moves_card() -> None:
    output = chat_with_kanban(
        board=INITIAL_BOARD_DATA,
        message=(
            "Por favor crea una nueva tarjeta llamada 'Configurar alertas de monitoreo' "
            "con detalles 'Configurar alarmas de CPU y memoria' en la columna 'Backlog' (col-1), "
            "y mueve la tarjeta 'card-1' a la columna 'En Progreso' (col-3)."
        ),
        history=[
            ChatMessage(role="user", content="Hola"),
            ChatMessage(
                role="assistant",
                content="Hola, estoy listo para ayudarte con tu tablero Kanban.",
            ),
        ],
    )

    assert output.reply
    assert output.updated_board is not None
    validated = BoardDataSchema.model_validate(output.updated_board.model_dump())

    assert "card-1" in validated.columns["col-3"].cardIds
    assert "card-1" not in validated.columns["col-1"].cardIds

    col1_titles = [
        validated.cards[cid].title for cid in validated.columns["col-1"].cardIds
    ]
    assert "Configurar alertas de monitoreo" in col1_titles

