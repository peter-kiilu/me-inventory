"""
Offline sync routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
import logging

from backend.database import get_db
from backend.models import SyncQueue, Sale, SaleItem, Product, Inventory, SaleStatus, SyncStatus
from backend.schemas import SyncQueueCreate, SyncQueue as SyncQueueSchema, MessageResponse
from backend.auth import verify_token

router = APIRouter(prefix="/api/sync", tags=["Sync"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@router.post("/queue", response_model=SyncQueueSchema, status_code=status.HTTP_201_CREATED)
async def add_to_sync_queue(
    sync_item: SyncQueueCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """
    Add an offline transaction to the sync queue.
    Used when client is back online and wants to sync offline transactions.
    """
    queue_item = SyncQueue(
        transaction_type=sync_item.transaction_type,
        payload=sync_item.payload,
        status=SyncStatus.PENDING
    )
    db.add(queue_item)
    db.commit()
    db.refresh(queue_item)
    return queue_item


@router.get("/queue", response_model=List[SyncQueueSchema])
async def get_sync_queue(
    status_filter: str = None,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Get all items in the sync queue, optionally filtered by status"""
    query = db.query(SyncQueue)
    
    if status_filter:
        query = query.filter(SyncQueue.status == status_filter)
    
    items = query.order_by(SyncQueue.created_at).all()
    return items


@router.post("/process", response_model=MessageResponse)
async def process_sync_queue(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """
    Process all pending items in the sync queue.
    This endpoint processes offline transactions in chronological order.
    """
    pending_items = db.query(SyncQueue).filter(
        SyncQueue.status == SyncStatus.PENDING
    ).order_by(SyncQueue.created_at).all()
    
    if not pending_items:
        return MessageResponse(message="No pending items to sync")
    
    processed = 0
    failed = 0
    
    for item in pending_items:
        try:
            if item.transaction_type == "sale":
                _process_sale_sync(item, db)
                processed += 1
            else:
                logger.warning(f"Unknown transaction type: {item.transaction_type}")
                item.status = SyncStatus.FAILED
                item.error_message = f"Unknown transaction type: {item.transaction_type}"
                failed += 1
        except Exception as e:
            logger.error(f"Error processing sync item {item.id}: {str(e)}")
            item.status = SyncStatus.FAILED
            item.error_message = str(e)
            failed += 1
    
    db.commit()
    
    return MessageResponse(
        message=f"Sync complete. Processed: {processed}, Failed: {failed}"
    )


def _process_sale_sync(sync_item: SyncQueue, db: Session):
    """Process a sale transaction from the sync queue"""
    try:
        # Parse payload
        payload = json.loads(sync_item.payload)
        items = payload.get("items", [])
        
        if not items:
            raise ValueError("Sale must contain at least one item")
        
        # Validate and prepare sale data
        sale_items_data = []
        total_amount = 0.0
        
        for item in items:
            product_id = item.get("product_id")
            quantity = item.get("quantity")
            
            if not product_id or not quantity:
                raise ValueError("Invalid sale item format")
            
            # Get product
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise ValueError(f"Product {product_id} not found")
            
            # Get inventory with lock
            inventory = db.query(Inventory).filter(
                Inventory.product_id == product_id
            ).with_for_update().first()
            
            if not inventory:
                raise ValueError(f"Inventory for product {product_id} not found")
            
            # Check stock - if insufficient, flag for manual review
            if inventory.quantity < quantity:
                raise ValueError(
                    f"Insufficient stock for {product.name}. "
                    f"Available: {inventory.quantity}, Requested: {quantity}. "
                    f"Manual review required."
                )
            
            subtotal = product.price * quantity
            total_amount += subtotal
            
            sale_items_data.append({
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": product.price,
                "subtotal": subtotal,
                "inventory": inventory
            })
        
        # Create sale
        sale = Sale(
            total_amount=total_amount,
            status=SaleStatus.COMPLETED,
            sync_status=SyncStatus.SYNCED,
            sale_date=payload.get("sale_date") or None  # Use offline timestamp if provided
        )
        db.add(sale)
        db.flush()
        
        # Create sale items and deduct inventory
        for item_data in sale_items_data:
            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                subtotal=item_data["subtotal"]
            )
            db.add(sale_item)
            item_data["inventory"].quantity -= item_data["quantity"]
        
        # Mark sync item as completed
        sync_item.status = SyncStatus.SYNCED
        from datetime import datetime
        sync_item.synced_at = datetime.utcnow()
        
        logger.info(f"Successfully synced sale from queue item {sync_item.id}")
        
    except Exception as e:
        logger.error(f"Error processing sale sync: {str(e)}")
        raise
