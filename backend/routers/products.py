"""
Product management routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Product, Inventory
from schemas import ProductCreate, ProductUpdate, ProductWithInventory, MessageResponse
from auth import verify_token

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/", response_model=List[ProductWithInventory])
async def get_products(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Get all products with inventory information"""
    query = db.query(Product)
    
    if category:
        query = query.filter(Product.category == category)
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductWithInventory)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get a single product by ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    return product


@router.post("/", response_model=ProductWithInventory, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Create a new product with initial inventory"""
    # Check if barcode already exists
    if product_data.barcode:
        existing = db.query(Product).filter(Product.barcode == product_data.barcode).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with barcode {product_data.barcode} already exists"
            )
    
    # Create product
    product = Product(
        name=product_data.name,
        description=product_data.description,
        category=product_data.category,
        price=product_data.price,
        barcode=product_data.barcode
    )
    db.add(product)
    db.flush()  # Get the product ID
    
    # Create inventory entry
    inventory = Inventory(
        product_id=product.id,
        quantity=product_data.initial_quantity,
        min_stock_level=product_data.min_stock_level
    )
    db.add(inventory)
    
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductWithInventory)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Update an existing product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    # Check barcode uniqueness if being updated
    if product_data.barcode and product_data.barcode != product.barcode:
        existing = db.query(Product).filter(Product.barcode == product_data.barcode).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with barcode {product_data.barcode} already exists"
            )
    
    # Update fields
    update_data = product_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Delete a product and its inventory"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    db.delete(product)
    db.commit()
    return MessageResponse(message=f"Product {product.name} deleted successfully")


@router.get("/categories/list", response_model=List[str])
async def get_categories(db: Session = Depends(get_db)):
    """Get all unique product categories"""
    categories = db.query(Product.category).distinct().all()
    return [cat[0] for cat in categories]
