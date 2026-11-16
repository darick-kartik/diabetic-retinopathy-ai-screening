
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.security import hash_password, verify_password
from backend.app.models.user import User
from backend.app.models.patient import Patient
from backend.app.schemas.auth import UserRegister


def register_patient(db: Session, user_data: UserRegister) -> User:
    normalized_email = str(user_data.email).strip().lower()

    try:
        existing_user = db.scalar(
            select(User).where(User.email == normalized_email)
        )

        if existing_user:
            raise ValueError("Email address is already registered.")

        new_user = User(
            email=normalized_email,
            full_name=user_data.full_name,
            password_hash=hash_password(user_data.password),
            role="PATIENT",
            is_active=True
        )

        db.add(new_user)
        db.flush()

        patient_code = f"PAT-{uuid.uuid4().hex[:12].upper()}"

        new_patient = Patient(
            user_id=new_user.id,
            patient_code=patient_code
        )

        db.add(new_patient)
        db.commit()
        db.refresh(new_user)

        return new_user

    except Exception:
        db.rollback()
        raise


def authenticate_user(
    db: Session,
    email: str,
    password: str
) -> User:

    normalized_email = email.strip().lower()

    user = db.scalar(
        select(User).where(User.email == normalized_email)
    )

    if user is None:
        raise ValueError("Invalid email or password.")

    if not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password.")

    if not user.is_active:
        raise ValueError("This account is inactive.")

    return user
