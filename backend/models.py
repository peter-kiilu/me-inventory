"""
SQLAlchemy ORM models for the inventory management system
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import enum

from database import Base


class SaleStatus(str, enum.Enum):
    """Enum for sale status"""
    COMPLETED = "completed"
    PENDING = "pending"
    FAILED = "failed"


class SyncStatus(str, enum.Enum):
    """Enum for sync status"""
    PENDING = "pending"
    SYNCED = "synced"
    FAILED = "failed"


class UserRole(str, enum.Enum):
    """Enum for user roles"""
    ADMIN = "admin"
    STAFF = "staff"


class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    pin_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STAFF, nullable=False)
    is_active = Column(Integer, default=1, nullable=False)  # 1=active, 0=inactive
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Product(Base):
    """Product model"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)
    barcode = Column(String(100), unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")
    sale_items = relationship("SaleItem", back_populates="product")


class Inventory(Base):
    """Inventory model - tracks stock levels"""
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    min_stock_level = Column(Integer, nullable=False, default=10)
    batch_number = Column(String(100), nullable=True, index=True)
    expiry_date = Column(Date, nullable=True, index=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="inventory")


class Sale(Base):
    """Sale transaction model"""
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    sale_date = Column(DateTime, default=datetime.utcnow, index=True)
    total_amount = Column(Float, nullable=False)
    status = Column(Enum(SaleStatus), default=SaleStatus.COMPLETED, nullable=False)
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.SYNCED, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    """Individual items in a sale"""
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    # Relationships
    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")


class SyncQueue(Base):
    """Queue for offline transactions waiting to be synced"""
    __tablename__ = "sync_queue"

    id = Column(Integer, primary_key=True, index=True)
    transaction_type = Column(String(50), nullable=False)  # 'sale', 'inventory_update', etc.
    payload = Column(Text, nullable=False)  # JSON string
    status = Column(Enum(SyncStatus), default=SyncStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    synced_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
