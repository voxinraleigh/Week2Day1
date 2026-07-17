from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .auth import router as auth_router
from .board import router as board_router
from .db import init_db

app = FastAPI(title="Account Heat Map")

init_db()

app.include_router(auth_router)
app.include_router(board_router)

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "out"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
