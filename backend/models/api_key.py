from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)

    # Pemilik API key.
    # Admin bisa melihat semua key, user hanya melihat key miliknya sendiri.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    name = Column(String, nullable=False)          # Nama/label key
    service = Column(String, nullable=False)       # "magnific", dll
    key_value = Column(String, nullable=False)     # API key aktual, jangan expose penuh ke frontend

    is_active = Column(Boolean, default=True)      # Aktif / nonaktif
    is_limited = Column(Boolean, default=False)    # Kena rate limit?
    priority = Column(Integer, default=1)          # Urutan rotasi

    last_used_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())