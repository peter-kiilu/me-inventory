"""
Analytics and reporting routes
"""
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.database import get_db
from backend.models import Sale, SaleItem, Product, Inventory
from backend.schemas import SalesAnalytics

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=SalesAnalytics)
async def get_dashboard_analytics(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive sales analytics for the dashboard.
    Default: last 30 days
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total sales amount and count
    sales_query = db.query(
        func.sum(Sale.total_amount).label("total"),
        func.count(Sale.id).label("count")
    ).filter(Sale.sale_date >= start_date).first()
    
    total_sales = float(sales_query.total) if sales_query.total else 0.0
    total_transactions = sales_query.count if sales_query.count else 0
    average_sale = total_sales / total_transactions if total_transactions > 0 else 0.0
    
    # Top selling products
    top_products_query = db.query(
        Product.id,
        Product.name,
        func.sum(SaleItem.quantity).label("quantity_sold"),
        func.sum(SaleItem.subtotal).label("revenue")
    ).join(SaleItem).join(Sale).filter(
        Sale.sale_date >= start_date
    ).group_by(Product.id, Product.name).order_by(
        desc("quantity_sold")
    ).limit(10).all()
    
    top_products = [
        {
            "product_id": p.id,
            "product_name": p.name,
            "quantity_sold": int(p.quantity_sold),
            "revenue": float(p.revenue)
        }
        for p in top_products_query
    ]
    
    # Sales by category
    category_query = db.query(
        Product.category,
        func.sum(SaleItem.subtotal).label("revenue"),
        func.sum(SaleItem.quantity).label("quantity")
    ).join(SaleItem).join(Sale).filter(
        Sale.sale_date >= start_date
    ).group_by(Product.category).all()
    
    sales_by_category = [
        {
            "category": c.category,
            "revenue": float(c.revenue),
            "quantity_sold": int(c.quantity)
        }
        for c in category_query
    ]
    
    # Daily sales for the period
    daily_sales_query = db.query(
        func.date(Sale.sale_date).label("date"),
        func.sum(Sale.total_amount).label("total"),
        func.count(Sale.id).label("transactions")
    ).filter(
        Sale.sale_date >= start_date
    ).group_by(func.date(Sale.sale_date)).order_by("date").all()
    
    daily_sales = [
        {
            "date": str(d.date),
            "total_sales": float(d.total),
            "transaction_count": int(d.transactions)
        }
        for d in daily_sales_query
    ]
    
    return SalesAnalytics(
        total_sales=total_sales,
        total_transactions=total_transactions,
        average_sale=average_sale,
        top_products=top_products,
        sales_by_category=sales_by_category,
        daily_sales=daily_sales
    )


@router.get("/low-stock")
async def get_low_stock_report(db: Session = Depends(get_db)):
    """Get products that are at or below minimum stock level"""
    low_stock = db.query(Product, Inventory).join(Inventory).filter(
        Inventory.quantity <= Inventory.min_stock_level
    ).all()
    
    return [
        {
            "product_id": product.id,
            "name": product.name,
            "category": product.category,
            "current_stock": inventory.quantity,
            "min_stock_level": inventory.min_stock_level,
            "units_needed": inventory.min_stock_level - inventory.quantity
        }
        for product, inventory in low_stock
    ]


@router.get("/revenue-trend")
async def get_revenue_trend(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get revenue trend over time"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    trend_data = db.query(
        func.date(Sale.sale_date).label("date"),
        func.sum(Sale.total_amount).label("revenue")
    ).filter(
        Sale.sale_date >= start_date
    ).group_by(func.date(Sale.sale_date)).order_by("date").all()
    
    return [
        {
            "date": str(t.date),
            "revenue": float(t.revenue)
        }
        for t in trend_data
    ]
