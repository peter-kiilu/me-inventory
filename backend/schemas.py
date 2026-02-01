"""
Pydantic schemas for request/response validation
"""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


# Product Schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    barcode: Optional[str] = Field(None, max_length=100)


class ProductCreate(ProductBase):
    initial_quantity: int = Field(default=0, ge=0)
    min_stock_level: int = Field(default=10, ge=0)
    batch_number: Optional[str] = Field(None, max_length=100)
    expiry_date: Optional[date] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    barcode: Optional[str] = Field(None, max_length=100)


class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Inventory Schemas
class InventoryBase(BaseModel):
    quantity: int = Field(..., ge=0)
    min_stock_level: int = Field(..., ge=0)
    batch_number: Optional[str] = Field(None, max_length=100)
    expiry_date: Optional[date] = None


class InventoryUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    min_stock_level: Optional[int] = Field(None, ge=0)
    batch_number: Optional[str] = Field(None, max_length=100)
    expiry_date: Optional[date] = None


class Inventory(InventoryBase):
    id: int
    product_id: int
    last_updated: datetime

    class Config:
        from_attributes = True


class ProductWithInventory(Product):
    inventory: Optional[Inventory] = None


# Sale Schemas
class SaleItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class SaleItemCreate(SaleItemBase):
    pass


class SaleItem(SaleItemBase):
    id: int
    sale_id: int
    unit_price: float
    subtotal: float
    product: Optional[Product] = None

    class Config:
        from_attributes = True


class SaleCreate(BaseModel):
    items: List[SaleItemCreate] = Field(..., min_length=1)


class Sale(BaseModel):
    id: int
    sale_date: datetime
    total_amount: float
    status: str
    sync_status: str
    created_at: datetime
    items: List[SaleItem] = []

    class Config:
        from_attributes = True


# Sync Queue Schemas
class SyncQueueCreate(BaseModel):
    transaction_type: str
    payload: str


class SyncQueue(BaseModel):
    id: int
    transaction_type: str
    payload: str
    status: str
    created_at: datetime
    synced_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


# Authentication Schemas
class AuthRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    pin: str = Field(..., min_length=4, max_length=10)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str


# User Management Schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    pin: str = Field(..., min_length=4, max_length=10)
    role: str = Field(default="staff", pattern="^(admin|staff)$")


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=1, max_length=100)
    pin: Optional[str] = Field(None, min_length=4, max_length=10)
    role: Optional[str] = Field(None, pattern="^(admin|staff)$")
    is_active: Optional[int] = Field(None, ge=0, le=1)


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Analytics Schemas
class SalesAnalytics(BaseModel):
    total_sales: float
    total_transactions: int
    average_sale: float
    top_products: List[dict]
    sales_by_category: List[dict]
    daily_sales: List[dict]


# Response Schemas
class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    detail: str
    success: bool = False
