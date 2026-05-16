from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.video_task import VideoTask
from services import magnific
from services.activity_logger import create_activity_log
from routers.auth import verify_token, TokenData
import os
import shutil
import uuid
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()


# Setup Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

router = APIRouter()

ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp"]
ALLOWED_VIDEOS = ["video/mp4", "video/quicktime", "video/webm"]


def can_access_task(token_data: TokenData, task: VideoTask) -> bool:
    if token_data.role == "admin":
        return True

    return task.user_id == token_data.user_id


def serialize_task(task: VideoTask) -> dict:
    return {
        "id": task.id,
        "user_id": task.user_id,
        "task_id": task.task_id,
        "model": task.model,
        "prompt": task.prompt,
        "image_url": task.image_url,
        "video_ref": task.video_ref,
        "status": task.status,
        "result_url": task.result_url,
        "duration": task.duration,
        "aspect_ratio": task.aspect_ratio,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }


# ─── Upload File ke Cloudinary ────────────────────
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = Form("image"),
    token_data: TokenData = Depends(verify_token),
):
    allowed = ALLOWED_IMAGES + ALLOWED_VIDEOS

    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Format tidak didukung: {file.content_type}",
        )

    ext = file.filename.split(".")[-1].lower()
    temp_name = f"{uuid.uuid4().hex}.{ext}"
    temp_path = f"uploads/temp/{temp_name}"

    os.makedirs("uploads/temp", exist_ok=True)

    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        resource_type = "video" if file_type == "video" else "image"

        result = cloudinary.uploader.upload(
            temp_path,
            resource_type=resource_type,
            folder="tools-agent",
        )

        public_url = result.get("secure_url")

        if not public_url:
            raise HTTPException(
                status_code=500,
                detail="Cloudinary tidak mengembalikan URL file.",
            )

        print(f"[Cloudinary] Upload success: {public_url}")

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal upload ke Cloudinary: {str(e)}",
        )

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return {
        "url": public_url,
        "filename": temp_name,
        "type": file_type,
    }


# ─── Generate Video ───────────────────────────────
class GenerateRequest(BaseModel):
    model: str
    prompt: str
    image_url: str
    video_ref_url: Optional[str] = None
    duration: Optional[int] = 5
    aspect_ratio: Optional[str] = "16:9"


@router.post("/generate")
async def generate_video(
    payload: GenerateRequest,
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    create_activity_log(
        db=db,
        user_id=token_data.user_id,
        action="generate_video_started",
        module="motion_studio",
        status="info",
        title="Generate video dimulai",
        description=f"User memulai generate video dengan model '{payload.model}'.",
        metadata={
            "model": payload.model,
            "duration": payload.duration,
            "aspect_ratio": payload.aspect_ratio,
            "has_image_url": bool(payload.image_url),
            "has_video_reference": bool(payload.video_ref_url),
        },
    )

    result = await magnific.generate_video(
        model=payload.model,
        prompt=payload.prompt,
        image_url=payload.image_url,
        video_ref_url=payload.video_ref_url,
        duration=payload.duration,
        aspect_ratio=payload.aspect_ratio,
        db=db,
        user_id=token_data.user_id,
    )

    if "error" in result:
        create_activity_log(
            db=db,
            user_id=token_data.user_id,
            action="generate_video_failed",
            module="motion_studio",
            status="failed",
            title="Generate video gagal",
            description=result["error"],
            metadata={
                "model": payload.model,
                "duration": payload.duration,
                "aspect_ratio": payload.aspect_ratio,
            },
        )

        raise HTTPException(status_code=400, detail=result["error"])

    print(f"[Generate] Full response: {result}")

    task_id = (
        result.get("task_id") or
        result.get("id") or
        result.get("taskId") or
        result.get("data", {}).get("task_id") or
        result.get("data", {}).get("id") or
        result.get("data", {}).get("taskId")
    )

    if not task_id:
        error_message = f"task_id tidak ditemukan di response Magnific: {result}"

        create_activity_log(
            db=db,
            user_id=token_data.user_id,
            action="generate_video_failed",
            module="motion_studio",
            status="failed",
            title="Generate video gagal",
            description="task_id tidak ditemukan di response Magnific.",
            metadata={
                "model": payload.model,
                "raw_response": result,
            },
        )

        print(f"[Generate] WARNING: task_id not found in response: {result}")
        raise HTTPException(status_code=400, detail=error_message)

    task = VideoTask(
        user_id=token_data.user_id,
        task_id=str(task_id),
        model=payload.model,
        prompt=payload.prompt,
        image_url=payload.image_url,
        video_ref=payload.video_ref_url,
        status="queued",
        duration=payload.duration,
        aspect_ratio=payload.aspect_ratio,
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    create_activity_log(
        db=db,
        user_id=token_data.user_id,
        action="generate_video_queued",
        module="motion_studio",
        status="success",
        title="Generate video masuk antrean",
        description=f"Task video berhasil dibuat dengan task_id '{task.task_id}'.",
        metadata={
            "db_id": task.id,
            "task_id": task.task_id,
            "model": task.model,
            "duration": task.duration,
            "aspect_ratio": task.aspect_ratio,
            "used_key_id": result.get("_used_key_id"),
            "used_key_name": result.get("_used_key_name"),
        },
    )

    return {
        "task_id": str(task_id),
        "status": "queued",
        "db_id": task.id,
    }


# ─── Cek Status ───────────────────────────────────
@router.get("/status/{task_id}")
async def check_status(
    task_id: str,
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    task = db.query(VideoTask).filter(VideoTask.task_id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task tidak ditemukan")

    if not can_access_task(token_data, task):
        raise HTTPException(status_code=403, detail="Tidak punya akses ke task ini")

    if task.status in ["completed", "failed"] and task.result_url:
        return {
            "task_id": task.task_id,
            "status": task.status,
            "result_url": task.result_url,
            "progress": 100 if task.status == "completed" else 0,
        }

    old_status = task.status

    result = await magnific.check_video_status(
        task.model,
        task_id,
        db,
        user_id=task.user_id,
    )

    if "error" in result:
        create_activity_log(
            db=db,
            user_id=task.user_id,
            action="status_check_failed",
            module="motion_studio",
            status="failed",
            title="Cek status video gagal",
            description=result["error"],
            metadata={
                "task_id": task.task_id,
                "model": task.model,
            },
        )

        raise HTTPException(status_code=400, detail=result["error"])

    status = result.get("status", "processing")
    result_url = result.get("result_url")
    progress = result.get("progress", 0)

    task.status = status

    if result_url:
        task.result_url = result_url

    db.commit()
    db.refresh(task)

    if old_status != task.status:
        if task.status == "completed":
            create_activity_log(
                db=db,
                user_id=task.user_id,
                action="generate_video_completed",
                module="motion_studio",
                status="success",
                title="Generate video selesai",
                description=f"Video task '{task.task_id}' berhasil selesai.",
                metadata={
                    "task_id": task.task_id,
                    "model": task.model,
                    "result_url": task.result_url,
                    "progress": progress,
                    "used_key_id": result.get("_used_key_id"),
                    "used_key_name": result.get("_used_key_name"),
                },
            )

        elif task.status == "failed":
            create_activity_log(
                db=db,
                user_id=task.user_id,
                action="generate_video_failed",
                module="motion_studio",
                status="failed",
                title="Generate video gagal",
                description=f"Video task '{task.task_id}' gagal diproses.",
                metadata={
                    "task_id": task.task_id,
                    "model": task.model,
                    "progress": progress,
                    "used_key_id": result.get("_used_key_id"),
                    "used_key_name": result.get("_used_key_name"),
                },
            )

        else:
            create_activity_log(
                db=db,
                user_id=task.user_id,
                action="generate_video_status_changed",
                module="motion_studio",
                status="info",
                title="Status video berubah",
                description=f"Status task '{task.task_id}' berubah dari '{old_status}' menjadi '{task.status}'.",
                metadata={
                    "task_id": task.task_id,
                    "model": task.model,
                    "old_status": old_status,
                    "new_status": task.status,
                    "progress": progress,
                },
            )

    return {
        "task_id": task.task_id,
        "status": task.status,
        "result_url": task.result_url,
        "progress": progress,
    }


# ─── Riwayat ──────────────────────────────────────
@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    query = db.query(VideoTask)

    if token_data.role != "admin":
        query = query.filter(VideoTask.user_id == token_data.user_id)

    tasks = query.order_by(VideoTask.created_at.desc()).limit(50).all()

    return [serialize_task(task) for task in tasks]


# ─── Hapus Task ───────────────────────────────────
@router.delete("/task/{task_id}")
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    task = db.query(VideoTask).filter(VideoTask.task_id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task tidak ditemukan")

    if not can_access_task(token_data, task):
        raise HTTPException(status_code=403, detail="Tidak punya akses ke task ini")

    deleted_task = {
        "task_id": task.task_id,
        "model": task.model,
        "status": task.status,
    }

    db.delete(task)
    db.commit()

    create_activity_log(
        db=db,
        user_id=token_data.user_id,
        action="video_task_deleted",
        module="motion_studio",
        status="warning",
        title="Task video dihapus",
        description=f"Task video '{deleted_task['task_id']}' berhasil dihapus.",
        metadata=deleted_task,
    )

    return {"message": "Task berhasil dihapus"}


# ─── Daftar Model ─────────────────────────────────
@router.get("/models")
def get_models(_: TokenData = Depends(verify_token)):
    return [
        {"id": "kling-2.6-motion", "name": "Kling 2.6 Motion Control Pro"},
        {"id": "kling-2.6-std-motion", "name": "Kling 2.6 Motion Control Std"},
        {"id": "kling-2.6-pro", "name": "Kling 2.6 Pro"},
        {"id": "kling-v3-pro", "name": "Kling 3 Pro"},
        {"id": "kling-v3-std", "name": "Kling 3 Standard"},
        {"id": "kling-v3-motion-pro", "name": "Kling 3 Motion Control Pro"},
        {"id": "kling-o1-pro", "name": "Kling O1 Pro"},
        {"id": "kling-o1-std", "name": "Kling O1 Standard"},
        {"id": "kling-4k-i2v", "name": "Kling 4K I2V"},
        {"id": "kling-2.5-pro", "name": "Kling 2.5 Pro"},
    ]