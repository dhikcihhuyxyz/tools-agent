from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Pemilik aktivitas.
    # Admin bisa melihat semua log.
    # User hanya melihat log miliknya sendiri.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # Contoh action:
    # user_register, user_login, api_key_create, api_key_update,
    # generate_video, generate_completed, generate_failed,
    # api_key_limited, api_key_failover
    action = Column(String, nullable=False, index=True)

    # Contoh:
    # auth, api_vault, motion_studio, magnific
    module = Column(String, nullable=True, index=True)

    # success / failed / info / warning
    status = Column(String, default="info", nullable=False)

    # Judul singkat log
    title = Column(String, nullable=False)

    # Detail panjang
    description = Column(Text, nullable=True)

    # Simpan metadata sederhana dalam bentuk JSON string
    metadata_json = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())