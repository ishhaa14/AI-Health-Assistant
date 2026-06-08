from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Create SQLAlchemy engine
# pool_pre_ping is useful to check connections and reconnect
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

# Session local factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base model
Base = declarative_base()

def get_db():
    """
    FastAPI dependency that provides a transactional database session.
    Ensures connection is closed after requests complete.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
