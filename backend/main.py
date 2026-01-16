"""
Main FastAPI application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import get_db, init_db
from backend.auth import authenticate_pin, create_access_token
from backend.schemas import AuthRequest, AuthResponse
from backend.routers import products, inventory, sales, pos, sync, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    init_db()
    print("✅ Database initialized")
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

# CORS configuration - adjust for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
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
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
