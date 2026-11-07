import hashlib
import hmac
import os
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

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


def get_current_username(request: Request) -> str:
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
    return username


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response) -> UserResponse:
    if payload.username != "user" or payload.password != "password":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    token = create_session_token(payload.username)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        path="/",
    )
    return UserResponse(username=payload.username)


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"status": "logged_out"}


@router.get("/me", response_model=UserResponse)
def get_me(username: str = Depends(get_current_username)) -> UserResponse:
    return UserResponse(username=username)

