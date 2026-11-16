
from datetime import datetime, timedelta, timezone

import jwt

from backend.app.core.config import settings


def create_access_token(user_id: str, role: str) -> str:
    """
    Generate a signed JWT access token for an authenticated user.
    """

    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(minutes=expires_in)

    payload = {
        "sub": user_id,
        "role": role,
        "iat": issued_at,
        "exp": expires_at
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return token
