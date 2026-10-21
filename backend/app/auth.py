import hashlib
import os
import secrets
from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "development-secret"
)

ALGORITHM = "HS256"


def normalize_password(password: str) -> str:
    if not password:
        raise ValueError("Password is required")

    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password must be 72 bytes or less")

    return password


def _pbkdf2_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100_000,
    )
    return f"pbkdf2_sha256${salt.hex()}${derived.hex()}"


def hash_password(password: str):
    normalized = normalize_password(password)

    try:
        return pwd_context.hash(normalized)
    except Exception:
        return _pbkdf2_hash(normalized)


def verify_password(
    plain_password: str,
    hashed_password: str
):
    if not hashed_password:
        return False

    normalized = normalize_password(plain_password)

    if hashed_password.startswith("pbkdf2_sha256$"):
        try:
            _, salt_hex, expected_hex = hashed_password.split("$", 2)
            salt = bytes.fromhex(salt_hex)
            derived = hashlib.pbkdf2_hmac(
                "sha256",
                normalized.encode("utf-8"),
                salt,
                100_000,
            )
            return derived.hex() == expected_hex
        except Exception:
            return False

    try:
        return pwd_context.verify(
            normalized,
            hashed_password
        )
    except Exception:
        return False


def create_access_token(user_id: int):

    expire = datetime.utcnow() + timedelta(
        hours=24
    )

    data = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )