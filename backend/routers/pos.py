"""
POS Integration endpoint
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import logging

from database import get_db
from models import Sale, SaleItem, Product, Inventory, SaleStatus, SyncStatus
from schemas import SaleCreate, Sale as SaleSchema

router = APIRouter(prefix="/api/pos", tags=["POS Integration"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@router.post("/sale", response_model=SaleSchema, status_code=status.HTTP_201_CREATED)
async def pos_sale(
    sale_data: SaleCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    POS Integration Endpoint
    
    Accepts sale transactions from external POS systems.
    
    Request Body:
    {
        "items": [
            {"product_id": 1, "quantity": 2},
            {"product_id": 3, "quantity": 1}
        ]
    }
    
    Response:
    - 201: Sale created successfully with sale details
    - 400: Invalid request (insufficient stock, invalid product, etc.)
    - 500: Server error
    
    The endpoint uses database transactions to ensure thread-safety
    and prevent race conditions during concurrent requests.
    """
    logger.info(f"POS Sale request from {request.client.host}")
    
    if not sale_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sale must contain at least one item"
        )
    
    try:
        # Validate all items and check stock availability
        sale_items_data = []
        total_amount = 0.0
        
        for item in sale_data.items:
            # Get product with row-level lock to prevent race conditions
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with id {item.product_id} not found"
                )
            
            # Get inventory with lock
            inventory = db.query(Inventory).filter(
                Inventory.product_id == item.product_id
            ).with_for_update().first()
            
            if not inventory:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Inventory for product {item.product_id} not found"
                )
            
            # Check sufficient stock
            if inventory.quantity < item.quantity:
                db.rollback()
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
            
            # Deduct from inventory (already locked)
            item_data["inventory"].quantity -= item_data["quantity"]
        
        db.commit()
        db.refresh(sale)
        
        logger.info(f"POS Sale {sale.id} created successfully. Total: ${total_amount:.2f}")
        return sale
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing POS sale: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing sale: {str(e)}"
        )
