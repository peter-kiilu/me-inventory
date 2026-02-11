"""
Seed data script to populate database with inventory products
"""
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import Product, Inventory, Sale, SaleItem


def seed_data():
    """Populate database with inventory products"""
    # Initialize database
    init_db()
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if products already exist
        existing_count = db.query(Product).count()
        
        if existing_count >= 50:
            print(f"[WARN] Products already seeded ({existing_count} found). Skipping.")
            return
        
        if existing_count > 0:
            print(f"[INFO] Found {existing_count} existing products. Clearing and re-seeding...")
            # Delete in order to respect foreign key constraints
            db.query(SaleItem).delete()
            db.query(Sale).delete()
            db.query(Inventory).delete()
            db.query(Product).delete()
            db.commit()

        if existing_demo >= 16:
            print(f"[WARN] Demo products already seeded ({existing_demo} found). Skipping.")
            return
        
        print(f"[INFO] Found {existing_demo} demo products, adding missing ones...")
        main
        
        print("[INFO] Creating inventory products...")
        
        # Real inventory products
        products = [
            {"name": "2kg Maclick Dry", "category": "Animal Feed", "price": 450, "quantity": 10, "min_stock": 5},
            {"name": "2kg Maclick Super", "category": "Animal Feed", "price": 550, "quantity": 10, "min_stock": 5},
            {"name": "70kg Kienyeji Pro", "category": "Animal Feed", "price": 2600, "quantity": 5, "min_stock": 2},
            {"name": "50mls Adamycin", "category": "Veterinary Medicine", "price": 280, "quantity": 10, "min_stock": 5},
            {"name": "100mls Adamycin", "category": "Veterinary Medicine", "price": 450, "quantity": 10, "min_stock": 5},
            {"name": "30g Vetoxy", "category": "Veterinary Medicine", "price": 100, "quantity": 15, "min_stock": 5},
            {"name": "6 Nursery Sleeves", "category": "Farm Inputs", "price": 600, "quantity": 20, "min_stock": 5},
            {"name": "30g Ascarex", "category": "Veterinary Medicine", "price": 130, "quantity": 15, "min_stock": 5},
            {"name": "250mls Hitman", "category": "Agrochemicals", "price": 1100, "quantity": 10, "min_stock": 3},
            {"name": "100mls Integra", "category": "Veterinary Medicine", "price": 450, "quantity": 10, "min_stock": 5},
            {"name": "70kg Kienyeji", "category": "Animal Feed", "price": 2600, "quantity": 5, "min_stock": 2},
            {"name": "5kg Maclick Super (2)", "category": "Animal Feed", "price": 1100, "quantity": 8, "min_stock": 3},
            {"name": "8kg Chick Mash", "category": "Poultry Feed", "price": 680, "quantity": 10, "min_stock": 3},
            {"name": "10kg Growers", "category": "Poultry Feed", "price": 700, "quantity": 10, "min_stock": 3},
            {"name": "4kg Crumb", "category": "Poultry Feed", "price": 400, "quantity": 10, "min_stock": 5},
            {"name": "5kg Chick Mash", "category": "Poultry Feed", "price": 420, "quantity": 10, "min_stock": 5},
            {"name": "50mls Omite", "category": "Agrochemicals", "price": 350, "quantity": 10, "min_stock": 5},
            {"name": "2kg Pioneer Maize", "category": "Seeds", "price": 800, "quantity": 10, "min_stock": 3},
            {"name": "2kg Duma 43", "category": "Seeds", "price": 750, "quantity": 10, "min_stock": 3},
            {"name": "10mls Dynamec", "category": "Agrochemicals", "price": 400, "quantity": 10, "min_stock": 5},
            {"name": "10kg Crumbs", "category": "Poultry Feed", "price": 1000, "quantity": 8, "min_stock": 3},
            {"name": "10kg Chickmash", "category": "Poultry Feed", "price": 850, "quantity": 8, "min_stock": 3},
            {"name": "5kg Growers mash", "category": "Poultry Feed", "price": 350, "quantity": 10, "min_stock": 5},
            {"name": "2kg Duma", "category": "Seeds", "price": 750, "quantity": 10, "min_stock": 3},
            {"name": "50mls Adamycin (2)", "category": "Veterinary Medicine", "price": 560, "quantity": 10, "min_stock": 5},
            {"name": "250mls Ranger", "category": "Agrochemicals", "price": 500, "quantity": 10, "min_stock": 5},
            {"name": "50mls Dairy Pi", "category": "Animal Feed", "price": 2200, "quantity": 5, "min_stock": 2},
            {"name": "1kg Growers", "category": "Poultry Feed", "price": 70, "quantity": 20, "min_stock": 10},
            {"name": "1kg Crumbs", "category": "Poultry Feed", "price": 100, "quantity": 20, "min_stock": 10},
            {"name": "1kg DAP", "category": "Fertilizers", "price": 120, "quantity": 20, "min_stock": 10},
            {"name": "15kg Chickmash", "category": "Poultry Feed", "price": 1275, "quantity": 5, "min_stock": 2},
            {"name": "5kg Growers PC", "category": "Poultry Feed", "price": 350, "quantity": 10, "min_stock": 5},
            {"name": "2kg Duma 43 (2)", "category": "Seeds", "price": 1500, "quantity": 8, "min_stock": 3},
            {"name": "2kg Sungura (2)", "category": "Seeds", "price": 1500, "quantity": 8, "min_stock": 3},
            {"name": "500mls Ndovu", "category": "Agrochemicals", "price": 1000, "quantity": 8, "min_stock": 3},
            {"name": "1ltr Weedal", "category": "Agrochemicals", "price": 800, "quantity": 8, "min_stock": 3},
            {"name": "1ltr Ndovu", "category": "Agrochemicals", "price": 2000, "quantity": 5, "min_stock": 2},
            {"name": "2kg Dekalb", "category": "Seeds", "price": 750, "quantity": 10, "min_stock": 3},
            {"name": "50kg Dairy Pi", "category": "Animal Feed", "price": 2200, "quantity": 5, "min_stock": 2},
            {"name": "70kg Kienyeji Pi", "category": "Animal Feed", "price": 2600, "quantity": 5, "min_stock": 2},
            {"name": "2kg Duma 43 (3)", "category": "Seeds", "price": 2250, "quantity": 5, "min_stock": 2},
            {"name": "50kg Dairy Meal", "category": "Animal Feed", "price": 2200, "quantity": 5, "min_stock": 2},
            {"name": "10 Nursery sleeves", "category": "Farm Inputs", "price": 1000, "quantity": 20, "min_stock": 5},
            {"name": "2kg Dap (2)", "category": "Fertilizers", "price": 240, "quantity": 15, "min_stock": 5},
            {"name": "2kg Pioneer Maize (4)", "category": "Seeds", "price": 3750, "quantity": 5, "min_stock": 2},
            {"name": "70kg Dairy Pio", "category": "Animal Feed", "price": 2600, "quantity": 5, "min_stock": 2},
            {"name": "10 Nursery Sleeves", "category": "Farm Inputs", "price": 1000, "quantity": 20, "min_stock": 5},
            {"name": "2kg Duma (2)", "category": "Seeds", "price": 1500, "quantity": 8, "min_stock": 3},
            {"name": "2kg Sungura", "category": "Seeds", "price": 750, "quantity": 10, "min_stock": 3},
            {"name": "50kg Bran (2)", "category": "Animal Feed", "price": 2500, "quantity": 5, "min_stock": 2},
        ]

        print("[INFO] Creating demo products...")
       main
        
        for product_data in products:
            # Create product
            product = Product(
                name=product_data["name"],
                description="",
                category=product_data["category"],
                price=product_data["price"],
                barcode=None
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
            
            print(f"  [OK] {product.name} ({product.category}) - KSH {product_data['price']} - Stock: {product_data['quantity']}")
        
        db.commit()
        print(f"\n[OK] Successfully created {len(products)} inventory products!")

            print(f"  [OK] {product.name} ({product.category}) - Stock: {product_data['quantity']}")
        
        db.commit()
        print(f"\n[OK] Successfully created {len(demo_products)} demo products!")
main
        
    except Exception as e:
        print(f"[ERROR] Error seeding data: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
