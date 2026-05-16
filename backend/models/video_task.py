from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class VideoTask(Base):
    __tablename__ = "video_tasks"

    id = Column(Integer, primary_key=True, index=True)

    # Pemilik task video
    # User hanya melihat task miliknya sendiri
    # Admin bisa melihat semua task
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    task_id = Column(String, unique=True, index=True)
    model = Column(String, nullable=False)
    prompt = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    video_ref = Column(String, nullable=True)

    status = Column(String, default="queued")
    result_url = Column(String, nullable=True)

    duration = Column(Integer, nullable=True)
    aspect_ratio = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())