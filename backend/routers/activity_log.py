import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models.activity_log import ActivityLog
from routers.auth import verify_token, TokenData

router = APIRouter()


def serialize_log(log: ActivityLog) -> dict:
    metadata = None

    if log.metadata_json:
        try:
            metadata = json.loads(log.metadata_json)
        except Exception:
            metadata = None

    return {
        "id": log.id,
        "user_id": log.user_id,
        "action": log.action,
        "module": log.module,
        "status": log.status,
        "title": log.title,
        "description": log.description,
        "metadata": metadata,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


@router.get("/")
def get_activity_logs(
    module: Optional[str] = None,
    action: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    query = db.query(ActivityLog)

    # Admin bisa lihat semua log.
    # User biasa hanya lihat log miliknya sendiri.
    if token_data.role != "admin":
        query = query.filter(ActivityLog.user_id == token_data.user_id)

    if module:
        query = query.filter(ActivityLog.module == module)

    if action:
        query = query.filter(ActivityLog.action == action)

    if status:
        query = query.filter(ActivityLog.status == status)

    logs = (
        query
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )

    return [serialize_log(log) for log in logs]


@router.get("/summary")
def get_activity_summary(
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    query = db.query(ActivityLog)

    if token_data.role != "admin":
        query = query.filter(ActivityLog.user_id == token_data.user_id)

    logs = query.all()

    return {
        "total": len(logs),
        "success": len([log for log in logs if log.status == "success"]),
        "failed": len([log for log in logs if log.status == "failed"]),
        "warning": len([log for log in logs if log.status == "warning"]),
        "info": len([log for log in logs if log.status == "info"]),
    }