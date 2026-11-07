import hashlib
import hmac
import os
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from app.db import authenticate_user, get_user_by_username

COOKIE_NAME = "pm_session"
DEFAULT_SECRET = "pm-mvp-local-session-secret"

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    username: str


def _get_secret() -> bytes:
    return os.getenv("SESSION_SECRET", DEFAULT_SECRET).encode("utf-8")


def create_session_token(username: str) -> str:
    signature = hmac.new(
        _get_secret(), username.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return f"{username}.{signature}"


def verify_session_token(token: str) -> str | None:
    if "." not in token:
        return None
    username, provided_sig = token.rsplit(".", 1)
    if not username:
        return None
    expected_sig = hmac.new(
        _get_secret(), username.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(provided_sig, expected_sig):
        return None
    return username


def get_current_user(request: Request) -> dict[str, Any]:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
        )
    username = verify_session_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión inválida",
        )
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )
    return user


def get_current_username(user: dict[str, Any] = Depends(get_current_user)) -> str:
    return str(user["username"])


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response) -> UserResponse:
    user = authenticate_user(payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    token = create_session_token(user["username"])
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        path="/",
    )
    return UserResponse(username=user["username"])


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"status": "logged_out"}


@router.get("/me", response_model=UserResponse)
def get_me(username: str = Depends(get_current_username)) -> UserResponse:
    return UserResponse(username=username)
