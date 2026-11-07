from fastapi.testclient import TestClient
from app.auth import COOKIE_NAME
from app.main import app


def test_me_requires_authentication() -> None:
    client = TestClient(app)
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_login_rejects_invalid_credentials() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/auth/login",
        json={"username": "user", "password": "wrong"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Credenciales inválidas"


def test_login_me_and_logout_flow() -> None:
    client = TestClient(app)

    login_res = client.post(
        "/api/auth/login",
        json={"username": "user", "password": "password"},
    )
    assert login_res.status_code == 200
    assert login_res.json() == {"username": "user"}
    assert COOKIE_NAME in client.cookies

    me_res = client.get("/api/auth/me")
    assert me_res.status_code == 200
    assert me_res.json() == {"username": "user"}

    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200

    after_logout = client.get("/api/auth/me")
    assert after_logout.status_code == 401


def test_tampered_cookie_is_rejected() -> None:
    client = TestClient(app)
    client.cookies.set(COOKIE_NAME, "user.fakesignature")
    response = client.get("/api/auth/me")
    assert response.status_code == 401

