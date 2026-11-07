from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.auth import router as auth_router

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

app = FastAPI(title="Gestor de Proyectos Kanban API")
app.include_router(auth_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/hello")
def hello() -> dict[str, str]:
    return {"message": "Hola mundo desde FastAPI"}


BACKEND_STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
FRONTEND_OUT_DIR = ROOT_DIR / "frontend" / "out"
STATIC_DIR = FRONTEND_OUT_DIR if FRONTEND_OUT_DIR.exists() else BACKEND_STATIC_DIR

if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
