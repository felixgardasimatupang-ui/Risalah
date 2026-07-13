"""
Async SQLAlchemy engine + session factory.
Default SQLite (dev), override RISALAH_DATABASE_URL for PostgreSQL.
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings

_connect_args = {}
_poolclass = None
if settings.database_url.startswith("sqlite"):
    _connect_args["check_same_thread"] = False
    _poolclass = NullPool

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args=_connect_args,
    poolclass=_poolclass,
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields per-request session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """Create all tables (dev). Prod uses alembic."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
