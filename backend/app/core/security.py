
import base64
import hashlib
import hmac
import secrets


ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 600_000
SALT_LENGTH = 16
HASH_LENGTH = 32


def hash_password(password: str) -> str:
    """
    Generate a salted PBKDF2-HMAC-SHA256 password hash.
    """

    if not isinstance(password, str) or not password:
        raise ValueError("Password cannot be empty.")

    salt = secrets.token_bytes(SALT_LENGTH)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        ITERATIONS,
        dklen=HASH_LENGTH,
    )

    salt_encoded = base64.urlsafe_b64encode(salt).decode("ascii")
    hash_encoded = base64.urlsafe_b64encode(password_hash).decode("ascii")

    return (
        f"{ALGORITHM}${ITERATIONS}$"
        f"{salt_encoded}${hash_encoded}"
    )


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a password against its stored PBKDF2 hash.
    """

    if not isinstance(plain_password, str) or not plain_password:
        return False

    if not isinstance(hashed_password, str):
        return False

    try:
        algorithm, iterations, salt_encoded, hash_encoded = (
            hashed_password.split("$")
        )

        if algorithm != ALGORITHM:
            return False

        iteration_count = int(iterations)

        if not 100_000 <= iteration_count <= 1_000_000:
            return False

        salt = base64.b64decode(
            salt_encoded,
            altchars=b"-_",
            validate=True,
        )

        expected_hash = base64.b64decode(
            hash_encoded,
            altchars=b"-_",
            validate=True,
        )

        if len(salt) != SALT_LENGTH or len(expected_hash) != HASH_LENGTH:
            return False

        calculated_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt,
            iteration_count,
            dklen=HASH_LENGTH,
        )

        return hmac.compare_digest(
            calculated_hash,
            expected_hash,
        )

    except (ValueError, TypeError, UnicodeError):
        return False
