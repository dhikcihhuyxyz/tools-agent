import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tools_agent.db")


def clean_database_url(url: str) -> str:
    if not url:
        return "sqlite:///./tools_agent.db"

    return (
        url.strip()
        .strip('"')
        .strip("'")
        .replace("\ufeff", "")
    )


def normalize_database_url(url: str) -> str:
    url = clean_database_url(url)

    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+pg8000://", 1)

    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+pg8000://", 1)

    return url


DATABASE_URL = normalize_database_url(DATABASE_URL)

connect_args = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()