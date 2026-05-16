import json
from sqlalchemy.orm import Session
from models.activity_log import ActivityLog


def create_activity_log(
    db: Session,
    action: str,
    title: str,
    user_id: int | None = None,
    module: str | None = None,
    status: str = "info",
    description: str | None = None,
    metadata: dict | None = None,
):
    """
    Helper untuk mencatat aktivitas sistem.
    Aman dipanggil dari router/service.
    Kalau gagal logging, jangan sampai merusak proses utama.
    """
    try:
        log = ActivityLog(
            user_id=user_id,
            action=action,
            module=module,
            status=status,
            title=title,
            description=description,
            metadata_json=json.dumps(metadata, ensure_ascii=False) if metadata else None,
        )

        db.add(log)
        db.commit()
        db.refresh(log)

        return log

    except Exception as e:
        db.rollback()
        print(f"[ActivityLog] Failed to create log: {str(e)}")
        return None