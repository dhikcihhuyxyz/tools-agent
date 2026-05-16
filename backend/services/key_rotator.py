from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from models.api_key import APIKey
from services.activity_logger import create_activity_log


def get_available_keys(service: str, db: Session, user_id: int | None = None) -> list[APIKey]:
    query = (
        db.query(APIKey)
        .filter(
            APIKey.service == service,
            APIKey.is_active == True,
            APIKey.is_limited == False,
        )
    )

    if user_id is not None:
        query = query.filter(APIKey.user_id == user_id)

    return query.order_by(APIKey.priority, APIKey.id).all()


def get_active_key(service: str, db: Session, user_id: int | None = None) -> str | None:
    keys = get_available_keys(service=service, db=db, user_id=user_id)
    return keys[0].key_value if keys else None


def get_active_key_record(service: str, db: Session, user_id: int | None = None) -> APIKey | None:
    keys = get_available_keys(service=service, db=db, user_id=user_id)
    return keys[0] if keys else None


def mark_key_as_limited(
    key_value: str,
    service: str,
    db: Session,
    error_message: str | None = None,
    user_id: int | None = None,
):
    query = db.query(APIKey).filter(
        APIKey.key_value == key_value,
        APIKey.service == service,
    )

    if user_id is not None:
        query = query.filter(APIKey.user_id == user_id)

    key = query.first()

    if key:
        key.is_limited = True
        key.last_error = error_message or "Rate limit / quota exceeded"
        db.commit()
        db.refresh(key)

        create_activity_log(
            db=db,
            user_id=key.user_id,
            action="api_key_limited",
            module="api_vault",
            status="warning",
            title="API key terkena limit",
            description=f"API key '{key.name}' untuk service '{key.service}' terkena limit.",
            metadata={
                "key_id": key.id,
                "name": key.name,
                "service": key.service,
                "error": key.last_error,
            },
        )

        print(f"[KeyRotator] Key '{key.name}' ditandai LIMITED, rotasi ke key berikutnya.")


def mark_key_as_used(
    key_value: str,
    service: str,
    db: Session,
    user_id: int | None = None,
):
    query = db.query(APIKey).filter(
        APIKey.key_value == key_value,
        APIKey.service == service,
    )

    if user_id is not None:
        query = query.filter(APIKey.user_id == user_id)

    key = query.first()

    if key:
        key.last_used_at = func.now()
        key.last_error = None
        db.commit()


def mark_key_error(
    key_value: str,
    service: str,
    db: Session,
    error_message: str,
    user_id: int | None = None,
):
    query = db.query(APIKey).filter(
        APIKey.key_value == key_value,
        APIKey.service == service,
    )

    if user_id is not None:
        query = query.filter(APIKey.user_id == user_id)

    key = query.first()

    if key:
        key.last_error = error_message
        db.commit()
        db.refresh(key)

        create_activity_log(
            db=db,
            user_id=key.user_id,
            action="api_key_error",
            module="api_vault",
            status="failed",
            title="API key error",
            description=f"API key '{key.name}' mengalami error saat digunakan.",
            metadata={
                "key_id": key.id,
                "name": key.name,
                "service": key.service,
                "error": error_message,
            },
        )


def get_next_available_key(service: str, db: Session, user_id: int | None = None) -> str | None:
    return get_active_key(service=service, db=db, user_id=user_id)


def count_available_keys(service: str, db: Session, user_id: int | None = None) -> int:
    query = db.query(APIKey).filter(
        APIKey.service == service,
        APIKey.is_active == True,
        APIKey.is_limited == False,
    )

    if user_id is not None:
        query = query.filter(APIKey.user_id == user_id)

    return query.count()