
from collections.abc import Generator

from sqlalchemy.orm import Session

from backend.app.database.connection import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    Provide a database session for a request
    and close it automatically when the request finishes.
    """
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
