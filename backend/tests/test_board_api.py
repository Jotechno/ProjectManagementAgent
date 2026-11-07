from pathlib import Path
from fastapi.testclient import TestClient
from app.db import create_user, init_db
from app.main import app


def test_database_is_created_automatically_if_missing(
    isolated_sqlite_db: Path,
) -> None:
    assert not isolated_sqlite_db.exists()
    init_db()
    assert isolated_sqlite_db.exists()


def test_board_endpoints_require_authentication() -> None:
    client = TestClient(app)
    get_res = client.get("/api/board")
    assert get_res.status_code == 401

    put_res = client.put(
        "/api/board",
        json={"columnOrder": [], "columns": {}, "cards": {}},
    )
    assert put_res.status_code == 401


def test_get_and_update_board_persists_in_sqlite(
    isolated_sqlite_db: Path,
) -> None:
    assert not isolated_sqlite_db.exists()

    with TestClient(app) as client:
        login_res = client.post(
            "/api/auth/login",
            json={"username": "user", "password": "password"},
        )
        assert login_res.status_code == 200
        assert isolated_sqlite_db.exists()

        board_res = client.get("/api/board")
        assert board_res.status_code == 200
        board = board_res.json()
        assert board["columnOrder"] == [
            "col-1",
            "col-2",
            "col-3",
            "col-4",
            "col-5",
        ]
        assert len(board["cards"]) == 7

        # Renombrar columna, editar tarjeta, mover tarjeta y crear nueva tarjeta
        board["columns"]["col-1"]["title"] = "Ideas Prioritarias"
        board["cards"]["card-1"]["title"] = "Arquitectura definida"
        board["columns"]["col-1"]["cardIds"].remove("card-1")
        board["columns"]["col-3"]["cardIds"].append("card-1")
        board["cards"]["card-99"] = {
            "id": "card-99",
            "title": "Nueva tarjeta persistente",
            "details": "Creada desde test de backend",
        }
        board["columns"]["col-2"]["cardIds"].append("card-99")

        put_res = client.put("/api/board", json=board)
        assert put_res.status_code == 200

        verify_res = client.get("/api/board")
        assert verify_res.status_code == 200
        saved = verify_res.json()
        assert saved["columns"]["col-1"]["title"] == "Ideas Prioritarias"
        assert saved["cards"]["card-1"]["title"] == "Arquitectura definida"
        assert "card-1" in saved["columns"]["col-3"]["cardIds"]
        assert saved["cards"]["card-99"]["title"] == "Nueva tarjeta persistente"


def test_put_board_rejects_inconsistent_payloads() -> None:
    client = TestClient(app)
    client.post(
        "/api/auth/login",
        json={"username": "user", "password": "password"},
    )
    board = client.get("/api/board").json()

    # Caso 1: tarjeta huérfana en cards que no está en ninguna columna
    invalid_orphan = {
        **board,
        "cards": {
            **board["cards"],
            "card-orphan": {
                "id": "card-orphan",
                "title": "Huérfana",
                "details": "",
            },
        },
    }
    res_orphan = client.put("/api/board", json=invalid_orphan)
    assert res_orphan.status_code == 422

    # Caso 2: columnOrder alterado
    invalid_cols = {
        **board,
        "columnOrder": ["col-1", "col-2"],
    }
    res_cols = client.put("/api/board", json=invalid_cols)
    assert res_cols.status_code == 422


def test_board_isolation_between_multiple_users() -> None:
    create_user("alice", "alicepass")

    client_user = TestClient(app)
    client_alice = TestClient(app)

    assert (
        client_user.post(
            "/api/auth/login",
            json={"username": "user", "password": "password"},
        ).status_code
        == 200
    )
    assert (
        client_alice.post(
            "/api/auth/login",
            json={"username": "alice", "password": "alicepass"},
        ).status_code
        == 200
    )

    alice_board = client_alice.get("/api/board").json()
    alice_board["columns"]["col-1"]["title"] = "Backlog de Alice"
    assert client_alice.put("/api/board", json=alice_board).status_code == 200

    user_board = client_user.get("/api/board").json()
    assert user_board["columns"]["col-1"]["title"] == "Backlog"
