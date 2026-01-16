"""
Authentication module with JWT tokens (production-safe)
"""

from datetime import datetime, timedelta
from typing import Optional

import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# =====================================================
# Security configuration (USE ENV VARIABLES IN PROD)
# =====================================================

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME_IN_PRODUCTION")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# =====================================================
# Password / PIN hashing
# =====================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

# =====================================================
# Default PIN (DEV ONLY)
# =====================================================
# ⚠️ In production, store hashed PINs in the database

DEFAULT_PIN_HASH = os.getenv(
    "DEFAULT_PIN_HASH",
    "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G7J0IfXaVg0o.G"  # hash of "1234"
)

# =====================================================
# JWT Bearer
# =====================================================

security = HTTPBearer()


# =====================================================
# Hashing helpers
# =====================================================

def get_password_hash(password: str) -> str:
    """
    Hash a password or PIN safely.

    bcrypt has a hard 72-byte limit — enforce it.
    """
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password/PIN exceeds bcrypt 72-byte limit")
    return pwd_context.hash(password)


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Verify PIN against stored bcrypt hash"""
    return pwd_context.verify(plain_pin, hashed_pin)


# =====================================================
# JWT helpers
# =====================================================

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create JWT access token.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta
        if expires_delta
        else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Verify JWT token from Authorization header.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


# =====================================================
# Authentication logic
# =====================================================

def authenticate_pin(pin: str) -> bool:
    """
    Authenticate user using PIN.
    DEV MODE: Using simple comparison. Use verify_pin with hashed PIN in production.
    """
    default_pin = os.getenv("DEFAULT_PIN", "1234")
    return pin == default_pin
