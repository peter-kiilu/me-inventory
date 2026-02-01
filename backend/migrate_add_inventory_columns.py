"""
Migration script to add batch_number and expiry_date columns to the inventory table.
Run this script with your DATABASE_URL environment variable set.
"""
import os
import sys
from sqlalchemy import create_engine, text

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is not set.")
    print("Set it using: set DATABASE_URL=your_render_postgres_url")
    sys.exit(1)

# Handle Render's postgres:// URL format
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Connecting to database...")

try:
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'inventory' 
            AND column_name IN ('batch_number', 'expiry_date')
        """))
        existing_columns = [row[0] for row in result]
        
        if 'batch_number' not in existing_columns:
            print("Adding batch_number column...")
            conn.execute(text("ALTER TABLE inventory ADD COLUMN batch_number VARCHAR(100)"))
            conn.execute(text("CREATE INDEX ix_inventory_batch_number ON inventory(batch_number)"))
            print("✓ batch_number column added")
        else:
            print("✓ batch_number column already exists")
        
        if 'expiry_date' not in existing_columns:
            print("Adding expiry_date column...")
            conn.execute(text("ALTER TABLE inventory ADD COLUMN expiry_date DATE"))
            conn.execute(text("CREATE INDEX ix_inventory_expiry_date ON inventory(expiry_date)"))
            print("✓ expiry_date column added")
        else:
            print("✓ expiry_date column already exists")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
except Exception as e:
    print(f"\n❌ Migration failed: {e}")
    sys.exit(1)
