from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models.api_key import APIKey
from routers.auth import verify_token, TokenData
from services.activity_logger import create_activity_log

router = APIRouter()


def mask_api_key(key_value: str) -> str:
    if not key_value:
        return ""

    if len(key_value) <= 8:
        return "*" * len(key_value)

    return f"{key_value[:4]}{'*' * (len(key_value) - 8)}{key_value[-4:]}"


def can_access_key(token_data: TokenData, key: APIKey) -> bool:
    if token_data.role == "admin":
        return True

    return key.user_id == token_data.user_id


def get_key_or_404(db: Session, key_id: int, token_data: TokenData) -> APIKey:
    key = db.query(APIKey).filter(APIKey.id == key_id).first()

    if not key:
        raise HTTPException(status_code=404, detail="API key tidak ditemukan")

    if not can_access_key(token_data, key):
        raise HTTPException(status_code=403, detail="Tidak punya akses ke API key ini")

    return key


class APIKeyCreate(BaseModel):
    name: str
    service: str
    key_value: str
    priority: Optional[int] = 1


class APIKeyUpdate(BaseModel):
    name: Optional[str] = None
    key_value: Optional[str] = None
    is_active: Optional[bool] = None
    is_limited: Optional[bool] = None
    priority: Optional[int] = None


class APIKeyResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    service: str
    key_value: str
    is_active: bool
    is_limited: bool
    priority: int
    last_used_at: Optional[str] = None
    last_error: Optional[str] = None


def serialize_key(key: APIKey) -> dict:
    return {
        "id": key.id,
        "user_id": key.user_id,
        "name": key.name,
        "service": key.service,
        "key_value": mask_api_key(key.key_value),
        "is_active": key.is_active,
        "is_limited": key.is_limited,
        "priority": key.priority,
        "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
        "last_error": key.last_error,
    }


@router.get("/keys", response_model=List[APIKeyResponse])
def get_all_keys(
    service: Optional[str] = None,
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    query = db.query(APIKey)

    if token_data.role != "admin":
        query = query.filter(APIKey.user_id == token_data.user_id)

    if service:
        query = query.filter(APIKey.service == service)

    keys = query.order_by(APIKey.service, APIKey.priority, APIKey.id).all()

    return [serialize_key(key) for key in keys]


@router.post("/keys", response_model=APIKeyResponse)
def create_key(
    payload: APIKeyCreate,
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    name = payload.name.strip()
    service = payload.service.strip().lower()
    key_value = payload.key_value.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Nama API key wajib diisi")

    if not service:
        raise HTTPException(status_code=400, detail="Service wajib diisi")

    if not key_value:
        raise HTTPException(status_code=400, detail="API key wajib diisi")

    key = APIKey(
        user_id=token_data.user_id,
        name=name,
        service=service,
        key_value=key_value,
        priority=payload.priority or 1,
        is_active=True,
        is_limited=False,
    )

    db.add(key)
    db.commit()
    db.refresh(key)

    create_activity_log(
        db=db,
        user_id=token_data.user_id,
        action="api_key_create",
        module="api_vault",
        status="success",
        title="API key ditambahkan",
        description=f"API key '{key.name}' untuk service '{key.service}' berhasil ditambahkan.",
        metadata={
            "key_id": key.id,
            "name": key.name,
            "service": key.service,
            "priority": key.priority,
        },
    )

    return serialize_key(key)


@router.patch("/keys/{key_id}", response_model=APIKeyResponse)
def update_key(
    key_id: int,
    payload: APIKeyUpdate,
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    key = get_key_or_404(db, key_id, token_data)

    old_data = {
        "name": key.name,
        "service": key.service,
        "is_active": key.is_active,
        "is_limited": key.is_limited,
        "priority": key.priority,
    }

    data = payload.model_dump(exclude_none=True)

    if "name" in data:
        data["name"] = data["name"].strip()
        if not data["name"]:
            raise HTTPException(status_code=400, detail="Nama API key tidak boleh kosong")

    if "service" in data:
        data["service"] = data["service"].strip().lower()

    if "key_value" in data:
        data["key_value"] = data["key_value"].strip()
        if not data["key_value"]:
            raise HTTPException(status_code=400, detail="API key tidak boleh kosong")

        key.is_limited = False
        key.last_error = None

    for field, value in data.items():
        setattr(key, field, value)

    db.commit()
    db.refresh(key)

    create_activity_log(
        db=db,
        user_id=token_data.user_id,
        action="api_key_update",
        module="api_vault",
        status="success",
        title="API key diperbarui",
        description=f"API key '{key.name}' berhasil diperbarui.",
        metadata={
            "key_id": key.id,
            "old": old_data,
            "updated_fields": list(data.keys()),
            "service": key.service,
        },
    )

    return serialize_key(key)


@router.delete("/keys/{key_id}")
def delete_key(
    key_id: int,
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    key = get_key_or_404(db, key_id, token_data)

    deleted_info = {
        "key_id": key.id,
        "name": key.name,
        "service": key.service,
        "priority": key.priority,
    }

    db.delete(key)
    db.commit()

    create_activity_log(
        db=db,
        user_id=token_data.user_id,
        action="api_key_delete",
        module="api_vault",
        status="success",
        title="API key dihapus",
        description=f"API key '{deleted_info['name']}' berhasil dihapus.",
        metadata=deleted_info,
    )

    return {"message": "API key berhasil dihapus"}


@router.post("/keys/{key_id}/reset")
def reset_key_limit(
    key_id: int,
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    key = get_key_or_404(db, key_id, token_data)

    key.is_limited = False
    key.is_active = True
    key.last_error = None

    db.commit()
    db.refresh(key)

    create_activity_log(
        db=db,
        user_id=token_data.user_id,
        action="api_key_reset",
        module="api_vault",
        status="success",
        title="Limit API key direset",
        description=f"Status limit API key '{key.name}' berhasil direset.",
        metadata={
            "key_id": key.id,
            "name": key.name,
            "service": key.service,
        },
    )

    return {"message": "Status key berhasil direset"}


@router.post("/keys/{key_id}/disable")
def disable_key(
    key_id: int,
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    key = get_key_or_404(db, key_id, token_data)

    key.is_active = False

    db.commit()
    db.refresh(key)

    create_activity_log(
        db=db,
        user_id=token_data.user_id,
        action="api_key_disable",
        module="api_vault",
        status="warning",
        title="API key dinonaktifkan",
        description=f"API key '{key.name}' dinonaktifkan.",
        metadata={
            "key_id": key.id,
            "name": key.name,
            "service": key.service,
        },
    )

    return {"message": "API key berhasil dinonaktifkan"}


@router.post("/keys/{key_id}/enable")
def enable_key(
    key_id: int,
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    key = get_key_or_404(db, key_id, token_data)

    key.is_active = True

    db.commit()
    db.refresh(key)

    create_activity_log(
        db=db,
        user_id=token_data.user_id,
        action="api_key_enable",
        module="api_vault",
        status="success",
        title="API key diaktifkan",
        description=f"API key '{key.name}' diaktifkan kembali.",
        metadata={
            "key_id": key.id,
            "name": key.name,
            "service": key.service,
        },
    )

    return {"message": "API key berhasil diaktifkan"}


@router.get("/status")
def get_vault_status(
    db: Session = Depends(get_db),
    token_data: TokenData = Depends(verify_token),
):
    query = db.query(APIKey)

    if token_data.role != "admin":
        query = query.filter(APIKey.user_id == token_data.user_id)

    all_keys = query.all()

    return {
        "total": len(all_keys),
        "active": len([k for k in all_keys if k.is_active and not k.is_limited]),
        "limited": len([k for k in all_keys if k.is_limited]),
        "inactive": len([k for k in all_keys if not k.is_active]),
    }