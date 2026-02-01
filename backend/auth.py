"""
Authentication module with JWT tokens and role-based access control
"""

from datetime import datetime, timedelta
from typing import Optional

import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRole

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
    Returns payload with user_id, username, and role.
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
# Role-based authorization
# =====================================================

def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Verify token and ensure user has admin role.
    Use this dependency for admin-only endpoints.
    """
    payload = verify_token(credentials)
    
    if payload.get("role") != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return payload


def require_staff_or_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Verify token and ensure user has staff or admin role.
    Use this dependency for endpoints accessible to all authenticated users.
    """
    payload = verify_token(credentials)
    
    role = payload.get("role")
    if role not in [UserRole.ADMIN.value, UserRole.STAFF.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return payload


# =====================================================
# Authentication logic
# =====================================================

def authenticate_user(username: str, pin: str, db: Session) -> Optional[User]:
    """
    Authenticate user by username and PIN.
    Returns User object if authenticated, None otherwise.
    """
    user = db.query(User).filter(
        User.username == username,
        User.is_active == 1
    ).first()
    
    if not user:
        return None
    
    if not verify_pin(pin, user.pin_hash):
        return None
    
    return user


def create_default_admin(db: Session):
    """
    Create default admin user if none exists.
    """
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    
    if not admin:
        default_pin = os.getenv("DEFAULT_ADMIN_PIN", "1234")
        admin = User(
            username="admin",
            pin_hash=get_password_hash(default_pin),
            role=UserRole.ADMIN,
            is_active=1
        )
        db.add(admin)
        db.commit()
        print("[OK] Default admin user created (username: admin, PIN: 1234)")
    
    return admin

