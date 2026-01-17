"""
Main FastAPI application
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db, init_db, SessionLocal
from auth import authenticate_pin, create_access_token
from schemas import AuthRequest, AuthResponse
from routers import products, inventory, sales, pos, sync, analytics
from models import Product


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    init_db()
    print("✅ Database initialized")
    
    # Auto-seed if database is empty
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            print("📦 Database is empty, seeding demo data...")
            from seed_data import seed_data
            seed_data()
        else:
            print("📦 Database already has data, skipping seed")
    finally:
        db.close()
    
    print("📊 Inventory Management System API started")
    print("📚 API docs available at: http://localhost:8000/docs")
    yield
    # Shutdown (add cleanup code here if needed)


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Inventory Management System API",
    description="REST API for retail shop inventory management with POS integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - reads from ALLOWED_ORIGINS environment variable
# In production, set ALLOWED_ORIGINS to your frontend URL(s), comma-separated
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_str == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(pos.router)
app.include_router(sync.router)
app.include_router(analytics.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Inventory Management System API",
        "version": "1.0.0",
        "docs": "/docs",
        "default_pin": "1234"
    }


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(auth_data: AuthRequest):
    """
    Authenticate with PIN and receive JWT token.
    Default PIN: 1234
    """
    if not authenticate_pin(auth_data.pin):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": "user"})
    
    return AuthResponse(access_token=access_token)


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "inventory-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
