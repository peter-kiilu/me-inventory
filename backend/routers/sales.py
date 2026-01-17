"""
Sales transaction routes
"""
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Sale, SaleItem, Product, Inventory, SaleStatus, SyncStatus
from schemas import SaleCreate, Sale as SaleSchema, MessageResponse
from auth import verify_token

router = APIRouter(prefix="/api/sales", tags=["Sales"])


@router.get("/", response_model=List[SaleSchema])
async def get_sales(
    skip: int = 0,
    limit: int = 100,
    days: int = None,
    db: Session = Depends(get_db)
):
    """
    Get sales history.
    Use days parameter to filter recent sales (e.g., days=7 for last week).
    """
    query = db.query(Sale)
    
    if days:
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(Sale.sale_date >= start_date)
    
    sales = query.order_by(Sale.sale_date.desc()).offset(skip).limit(limit).all()
    return sales


@router.get("/{sale_id}", response_model=SaleSchema)
async def get_sale(
    sale_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific sale by ID"""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sale with id {sale_id} not found"
        )
    return sale


@router.post("/", response_model=SaleSchema, status_code=status.HTTP_201_CREATED)
async def create_sale(
    sale_data: SaleCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """
    Create a new sale transaction.
    Automatically deducts stock and prevents sales with insufficient inventory.
    """
    if not sale_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sale must contain at least one item"
        )
    
    # Validate all items and check stock availability
    sale_items_data = []
    total_amount = 0.0
    
    for item in sale_data.items:
        # Get product
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} not found"
            )
        
        # Get inventory
        inventory = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory for product {item.product_id} not found"
            )
        
        # Check sufficient stock
        if inventory.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.name}. Available: {inventory.quantity}, Requested: {item.quantity}"
            )
        
        # Calculate subtotal
        subtotal = product.price * item.quantity
        total_amount += subtotal
        
        sale_items_data.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": product.price,
            "subtotal": subtotal,
            "inventory": inventory
        })
    
    # Create sale
    sale = Sale(
        total_amount=total_amount,
        status=SaleStatus.COMPLETED,
        sync_status=SyncStatus.SYNCED
    )
    db.add(sale)
    db.flush()  # Get sale ID
    
    # Create sale items and deduct inventory
    for item_data in sale_items_data:
        # Create sale item
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"]
        )
        db.add(sale_item)
        
        # Deduct from inventory
        item_data["inventory"].quantity -= item_data["quantity"]
    
    db.commit()
    db.refresh(sale)
    return sale


@router.delete("/{sale_id}", response_model=MessageResponse)
async def delete_sale(
    sale_id: int,
    restore_inventory: bool = True,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """
    Delete a sale transaction.
    Use restore_inventory=true to add the sold quantities back to inventory.
    """
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sale with id {sale_id} not found"
        )
    
    # Restore inventory if requested
    if restore_inventory:
        for item in sale.items:
            inventory = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
            if inventory:
                inventory.quantity += item.quantity
    
    db.delete(sale)
    db.commit()
    return MessageResponse(message=f"Sale {sale_id} deleted successfully")
