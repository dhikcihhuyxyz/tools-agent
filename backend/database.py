import os
import ssl
from urllib.parse import urlsplit, urlunsplit

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tools_agent.db")


def clean_database_url(url: str) -> str:
    if not url:
        return "sqlite:///./tools_agent.db"

    url = (
        url.strip()
        .strip('"')
        .strip("'")
        .replace("\ufeff", "")
    )

    if url.startswith("DATABASE_URL="):
        url = url.replace("DATABASE_URL=", "", 1).strip()

    return url


def normalize_database_url(url: str) -> str:
    url = clean_database_url(url)

    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+pg8000://", 1)

    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+pg8000://", 1)

    return url


def remove_unsupported_postgres_query(url: str) -> str:
    parts = urlsplit(url)

    if not parts.query:
        return url

    blocked_keys = {
        "sslmode",
        "channel_binding",
    }

    query_items = []

    for item in parts.query.split("&"):
        if not item:
            continue

        key = item.split("=", 1)[0]

        if key not in blocked_keys:
            query_items.append(item)

    return urlunsplit(
        (
            parts.scheme,
            parts.netloc,
            parts.path,
            "&".join(query_items),
            parts.fragment,
        )
    )


DATABASE_URL = normalize_database_url(DATABASE_URL)

connect_args = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

if DATABASE_URL.startswith("postgresql+pg8000"):
    DATABASE_URL = remove_unsupported_postgres_query(DATABASE_URL)
    connect_args = {
        "ssl_context": ssl.create_default_context()
    }

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
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