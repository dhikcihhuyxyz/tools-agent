import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base

# Import semua model aktif supaya tabel ikut dibuat
from models import (
    api_key,
    video_task,
    user,
    activity_log,
)

from routers import (
    auth,
    api_vault,
    motion_studio,
    activity_log as activity_log_router,
    admin_users,
)

load_dotenv()


def is_vercel():
    return os.getenv("VERCEL") == "1"


UPLOAD_ROOT = "/tmp/uploads" if is_vercel() else "uploads"

os.makedirs(f"{UPLOAD_ROOT}/images", exist_ok=True)
os.makedirs(f"{UPLOAD_ROOT}/videos", exist_ok=True)
os.makedirs(f"{UPLOAD_ROOT}/temp", exist_ok=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ToolsAgent API", version="1.0.0")


def get_allowed_origins():
    raw = os.getenv("CORS_ORIGINS", "")

    default_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://192.168.18.5:3000",
        "http://192.168.18.5:5173",
    ]

    if not raw:
        return default_origins

    extra_origins = [
        item.strip()
        for item in raw.split(",")
        if item.strip()
    ]

    return list(dict.fromkeys(default_origins + extra_origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(api_vault.router, prefix="/api/vault", tags=["API Vault"])
app.include_router(motion_studio.router, prefix="/api/motion", tags=["Motion Studio"])
app.include_router(activity_log_router.router, prefix="/api/activity", tags=["Activity Log"])
app.include_router(admin_users.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
def root():
    return {"status": "ToolsAgent API running ✅"}