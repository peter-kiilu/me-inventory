"""
Main FastAPI application
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db, init_db
from auth import authenticate_user, create_access_token, create_default_admin
from schemas import AuthRequest, AuthResponse
from routers import products, inventory, sales, pos, sync, analytics, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    init_db()
    print("[OK] Database initialized")
    
    # Create default admin user
    from database import SessionLocal
    db = SessionLocal()
    try:
        create_default_admin(db)
    finally:
        db.close()
    
    # Auto-seed demo data on startup (seed_data handles duplicate prevention)
    from seed_data import seed_data
    seed_data()
    
    print("[INFO] Inventory Management System API started")
    print("[DOCS] API docs available at: http://localhost:8000/docs")
    yield
    # Shutdown (add cleanup code here if needed)


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Inventory Management System API",
    description="REST API for retail shop inventory management with POS integration and role-based access control",
    version="2.0.0",
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
app.include_router(users.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Inventory Management System API",
        "version": "2.0.0",
        "docs": "/docs",
        "docs_url": "/docs"
    }


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(auth_data: AuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate with PIN and receive JWT token.
    Use your configured PIN to authenticate.
    Authenticate with username and PIN to receive JWT token.
    The token includes the user's role for access control.
    """
    user = authenticate_user(auth_data.username, auth_data.pin, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or PIN"
        )
    
    # Create access token with user info
    access_token = create_access_token(data={
        "sub": str(user.id),
        "user_id": user.id,
        "username": user.username,
        "role": user.role.value
    })
    
    return AuthResponse(
        access_token=access_token,
        user_id=user.id,
        username=user.username,
        role=user.role.value
    )


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "inventory-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
