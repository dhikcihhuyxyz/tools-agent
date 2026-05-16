from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from routers.auth import verify_token, TokenData
from models.user import User
from models.api_key import APIKey
from models.video_task import VideoTask
from models.activity_log import ActivityLog

router = APIRouter()


def require_admin(token_data: TokenData):
    if token_data.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Hanya admin yang bisa mengakses User Management",
        )


@router.get("/users")
def get_users(
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    require_admin(token_data)

    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    result = []

    for user in users:
        api_key_count = (
            db.query(func.count(APIKey.id))
            .filter(APIKey.user_id == user.id)
            .scalar()
        )

        active_api_key_count = (
            db.query(func.count(APIKey.id))
            .filter(APIKey.user_id == user.id)
            .filter(APIKey.is_active == True)
            .scalar()
        )

        video_count = (
            db.query(func.count(VideoTask.id))
            .filter(VideoTask.user_id == user.id)
            .scalar()
        )

        completed_video_count = (
            db.query(func.count(VideoTask.id))
            .filter(VideoTask.user_id == user.id)
            .filter(VideoTask.status == "completed")
            .scalar()
        )

        activity_count = (
            db.query(func.count(ActivityLog.id))
            .filter(ActivityLog.user_id == user.id)
            .scalar()
        )

        result.append({
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "stats": {
                "api_keys": api_key_count or 0,
                "active_api_keys": active_api_key_count or 0,
                "videos": video_count or 0,
                "completed_videos": completed_video_count or 0,
                "activities": activity_count or 0,
            },
        })

    return result


@router.get("/users/summary")
def get_users_summary(
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    require_admin(token_data)

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_admins = db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0
    total_regular_users = db.query(func.count(User.id)).filter(User.role == "user").scalar() or 0

    total_api_keys = db.query(func.count(APIKey.id)).scalar() or 0
    total_videos = db.query(func.count(VideoTask.id)).scalar() or 0
    total_activities = db.query(func.count(ActivityLog.id)).scalar() or 0

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_regular_users": total_regular_users,
        "total_api_keys": total_api_keys,
        "total_videos": total_videos,
        "total_activities": total_activities,
    }