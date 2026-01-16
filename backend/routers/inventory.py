"""
Inventory management routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Inventory, Product
from backend.schemas import InventoryUpdate, ProductWithInventory, MessageResponse
from backend.auth import verify_token

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@router.get("/", response_model=List[ProductWithInventory])
async def get_inventory(
    skip: int = 0,
    limit: int = 100,
    low_stock: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get inventory status for all products.
    Use low_stock=true to filter products below minimum stock level.
    """
    query = db.query(Product)
    
    if low_stock:
        query = query.join(Inventory).filter(Inventory.quantity <= Inventory.min_stock_level)
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductWithInventory)
async def get_product_inventory(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get inventory status for a specific product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    return product


@router.put("/{product_id}", response_model=ProductWithInventory)
async def update_inventory(
    product_id: int,
    inventory_data: InventoryUpdate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Update inventory levels for a product"""
    inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory for product {product_id} not found"
        )
    
    # Update fields
    update_data = inventory_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(inventory, key, value)
    
    db.commit()
    
    # Return product with updated inventory
    product = db.query(Product).filter(Product.id == product_id).first()
    return product


@router.post("/{product_id}/adjust", response_model=ProductWithInventory)
async def adjust_inventory(
    product_id: int,
    adjustment: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """
    Adjust inventory by a relative amount (positive to add, negative to remove).
    Example: adjustment=10 adds 10 units, adjustment=-5 removes 5 units.
    """
    inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory for product {product_id} not found"
        )
    
    new_quantity = inventory.quantity + adjustment
    
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Adjustment would result in negative inventory ({new_quantity})"
        )
    
    inventory.quantity = new_quantity
    db.commit()
    
    # Return product with updated inventory
    product = db.query(Product).filter(Product.id == product_id).first()
    return product
