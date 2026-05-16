import os
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from services.activity_logger import create_activity_log

load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "tools-agent-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class RegisterRequest(BaseModel):
    username: str
    password: str


class TokenData(BaseModel):
    username: str
    role: str
    user_id: int


class UserResponse(BaseModel):
    id: int
    username: str
    role: str


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    payload = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload.update({"exp": expire})

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def ensure_default_admin(db: Session):
    admin = db.query(User).filter(User.username == ADMIN_USERNAME).first()

    if admin:
        return admin

    admin = User(
        username=ADMIN_USERNAME,
        hashed_password=hash_password(ADMIN_PASSWORD),
        role="admin",
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    print(f"[Auth] Default admin created: {ADMIN_USERNAME}")

    return admin


def authenticate_user(db: Session, username: str, password: str):
    ensure_default_admin(db)

    user = db.query(User).filter(User.username == username).first()

    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user


def serialize_user(user: User):
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
    }


def verify_token(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        username = payload.get("sub")
        role = payload.get("role")
        user_id = payload.get("user_id")

        if username is None or role is None or user_id is None:
            raise HTTPException(status_code=401, detail="Token tidak valid")

        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=401, detail="User tidak ditemukan")

        return TokenData(
            username=username,
            role=role,
            user_id=user_id,
        )

    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid")


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    ensure_default_admin(db)

    username = payload.username.strip()
    password = payload.password

    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username minimal 3 karakter")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password minimal 6 karakter")

    existing_user = db.query(User).filter(User.username == username).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username sudah digunakan")

    user = User(
        username=username,
        hashed_password=hash_password(password),
        role="user",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    create_activity_log(
        db=db,
        user_id=user.id,
        action="user_register",
        module="auth",
        status="success",
        title=f"{user.username} mendaftar",
        description=f'User baru "{user.username}" berhasil membuat akun.',
        metadata={
            "username": user.username,
            "role": user.role,
        },
    )

    return serialize_user(user)


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Username atau password salah")

    access_token = create_access_token(
        data={
            "sub": user.username,
            "role": user.role,
            "user_id": user.id,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(user),
    }


@router.get("/me")
def me(
    token_data: TokenData = Depends(verify_token),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == token_data.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    return serialize_user(user)