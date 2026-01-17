"""
Seed data script to populate database with demo products
"""
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import Product, Inventory


def seed_data():
    """Populate database with demo data"""
    # Initialize database
    init_db()
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check how many demo products already exist (by barcode prefix)
        demo_barcodes = ['ELC', 'BEV', 'SNK', 'STA', 'PC0']
        existing_demo = db.query(Product).filter(
            Product.barcode.like('ELC%') | 
            Product.barcode.like('BEV%') | 
            Product.barcode.like('SNK%') | 
            Product.barcode.like('STA%') | 
            Product.barcode.like('PC0%')
        ).count()
        
        if existing_demo >= 16:
            print(f"⚠️  Demo products already seeded ({existing_demo} found). Skipping.")
            return
        
        print(f"📦 Found {existing_demo} demo products, adding missing ones...")
        
        # Demo products
        demo_products = [
            # Electronics
            {"name": "Wireless Mouse", "description": "Ergonomic wireless mouse with USB receiver", "category": "Electronics", "price": 25.99, "barcode": "ELC001", "quantity": 50, "min_stock": 10},
            {"name": "USB-C Cable", "description": "Fast charging USB-C cable 2m", "category": "Electronics", "price": 12.99, "barcode": "ELC002", "quantity": 100, "min_stock": 20},
            {"name": "Bluetooth Speaker", "description": "Portable Bluetooth speaker with 10hr battery", "category": "Electronics", "price": 45.00, "barcode": "ELC003", "quantity": 30, "min_stock": 5},
            {"name": "Phone Case", "description": "Protective phone case for iPhone", "category": "Electronics", "price": 15.99, "barcode": "ELC004", "quantity": 75, "min_stock": 15},
            
            # Beverages
            {"name": "Coca Cola 500ml", "description": "Refreshing cola drink", "category": "Beverages", "price": 1.99, "barcode": "BEV001", "quantity": 200, "min_stock": 50},
            {"name": "Water Bottle 1L", "description": "Pure mineral water", "category": "Beverages", "price": 0.99, "barcode": "BEV002", "quantity": 300, "min_stock": 100},
            {"name": "Orange Juice 1L", "description": "100% pure orange juice", "category": "Beverages", "price": 3.49, "barcode": "BEV003", "quantity": 80, "min_stock": 20},
            
            # Snacks
            {"name": "Potato Chips", "description": "Crispy salted potato chips", "category": "Snacks", "price": 2.49, "barcode": "SNK001", "quantity": 150, "min_stock": 30},
            {"name": "Chocolate Bar", "description": "Milk chocolate bar 100g", "category": "Snacks", "price": 1.79, "barcode": "SNK002", "quantity": 120, "min_stock": 40},
            {"name": "Granola Bar", "description": "Healthy granola bar with nuts", "category": "Snacks", "price": 2.99, "barcode": "SNK003", "quantity": 90, "min_stock": 25},
            
            # Stationery
            {"name": "Notebook A5", "description": "Ruled notebook 100 pages", "category": "Stationery", "price": 4.99, "barcode": "STA001", "quantity": 60, "min_stock": 15},
            {"name": "Ballpoint Pen Pack", "description": "Pack of 10 blue pens", "category": "Stationery", "price": 5.99, "barcode": "STA002", "quantity": 40, "min_stock": 10},
            {"name": "Sticky Notes", "description": "Pack of 3 colorful sticky note pads", "category": "Stationery", "price": 3.49, "barcode": "STA003", "quantity": 70, "min_stock": 20},
            
            # Personal Care
            {"name": "Hand Sanitizer", "description": "Antibacterial hand sanitizer 250ml", "category": "Personal Care", "price": 4.99, "barcode": "PC001", "quantity": 100, "min_stock": 30},
            {"name": "Tissues Box", "description": "Soft facial tissues 200 count", "category": "Personal Care", "price": 2.99, "barcode": "PC002", "quantity": 80, "min_stock": 25},
            {"name": "Soap Bar", "description": "Moisturizing soap bar", "category": "Personal Care", "price": 1.99, "barcode": "PC003", "quantity": 120, "min_stock": 40},
        ]
        
        print("📦 Creating demo products...")
        
        for product_data in demo_products:
            # Create product
            product = Product(
                name=product_data["name"],
                description=product_data["description"],
                category=product_data["category"],
                price=product_data["price"],
                barcode=product_data["barcode"]
            )
            db.add(product)
            db.flush()  # Get product ID
            
            # Create inventory
            inventory = Inventory(
                product_id=product.id,
                quantity=product_data["quantity"],
                min_stock_level=product_data["min_stock"]
            )
            db.add(inventory)
            
            print(f"  ✅ {product.name} ({product.category}) - Stock: {product_data['quantity']}")
        
        db.commit()
        print(f"\n✅ Successfully created {len(demo_products)} demo products!")
        print("🔐 Default PIN: 1234")
        
    except Exception as e:
        print(f"❌ Error seeding data: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
