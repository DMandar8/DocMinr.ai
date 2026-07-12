"""
FastAPI Application Entry Point
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import time
from datetime import datetime

from app.core.config import settings
from app.api.routes import health

# Setup logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Service for DocMinr.ai - Document Processing and RAG",
)

# Add CORS middleware (so backend can talk to us)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to backend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    start_time = time.time()
    
    # Get request body size
    body_size = 0
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            body = await request.body()
            body_size = len(body)
        except:
            pass
    
    # Process request
    response = await call_next(request)
    
    # Log
    duration = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} "
        f"({duration:.3f}s, {body_size} bytes)"
    )
    
    return response

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions"""
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error",
            "path": request.url.path,
            "timestamp": datetime.now().isoformat()
        }
    )

# ============================================
# Register Routes
# ============================================

# Health routes
app.include_router(
    health.router,
    prefix="/api/v1",
    tags=["health"]
)

# ============================================
# Root Endpoint
# ============================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

# ============================================
# Startup & Shutdown Events
# ============================================

@app.on_event("startup")
async def startup_event():
    """Run when service starts"""
    logger.info("🚀 Starting AI Service...")
    logger.info(f"   Service: {settings.APP_NAME}")
    logger.info(f"   Version: {settings.APP_VERSION}")
    logger.info(f"   Environment: {settings.ENVIRONMENT}")
    logger.info(f"   Backend URL: {settings.BACKEND_API_URL}")
    logger.info("   ✅ Service ready")

@app.on_event("shutdown")
async def shutdown_event():
    """Run when service stops"""
    logger.info("🛑 Shutting down AI Service...")

# If running directly (python main.py)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )