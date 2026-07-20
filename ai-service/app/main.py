"""
FastAPI Application Entry Point - DEBUG VERSION
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import time
from datetime import datetime
import sys
import os

from app.core.config import settings
from app.api.routes import health, process  
from app.api.routes import health, process, search  # Add search
from app.api.routes import health, process, search, build_prompt



# ============================================
# Setup logging with DEBUG level
# ============================================
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("=" * 60)
logger.info("🚀 AI SERVICE STARTING - DEBUG MODE ENABLED")
logger.info("=" * 60)
logger.info(f"   Service: {settings.APP_NAME}")
logger.info(f"   Version: {settings.APP_VERSION}")
logger.info(f"   Environment: {settings.ENVIRONMENT}")
logger.info(f"   Debug Mode: {settings.DEBUG}")
logger.info(f"   Host: {settings.HOST}")
logger.info(f"   Port: {settings.PORT}")
logger.info(f"   Backend URL: {settings.BACKEND_API_URL}")
logger.info(f"   Python Version: {sys.version}")
logger.info(f"   Working Directory: {os.getcwd()}")
logger.info("=" * 60)

# Create FastAPI app
logger.debug("📦 Creating FastAPI app...")
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Service for DocMinr.ai - Document Processing and RAG",
)
logger.debug("✅ FastAPI app created")

# Add CORS middleware
logger.debug("🔧 Adding CORS middleware...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.debug("✅ CORS middleware added")




# ============================================
# Request Logging Middleware
# ============================================
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests WITHOUT consuming body"""
    start_time = time.time()
    
    # Log request details (NO body reading!)
    logger.info("-" * 50)
    logger.info(f"📨 {request.method} {request.url.path}")
    logger.info(f"   Client: {request.client.host if request.client else 'unknown'}")
    
    # Process request
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    # Log response
    logger.info(f"📤 {response.status_code} ({duration:.3f}s)")
    logger.info("-" * 50)
    
    return response


# ============================================
# Global Error Handler
# ============================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions"""
    logger.error("=" * 50)
    logger.error("💥 UNHANDLED EXCEPTION")
    logger.error(f"   Path: {request.url.path}")
    logger.error(f"   Method: {request.method}")
    logger.error(f"   Error: {str(exc)}")
    logger.error(f"   Traceback:", exc_info=True)
    logger.error("=" * 50)
    
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
logger.debug("🔧 Registering routes...")

# Health routes
logger.debug("   Registering health routes...")
app.include_router(
    health.router,
    prefix="/api/v1",
    tags=["health"]
)
logger.debug("   ✅ Health routes registered")

# Process routes
logger.debug("   Registering process routes...")
app.include_router(
    process.router,
    prefix="/api/v1",
    tags=["processing"]
)
logger.debug("   ✅ Process routes registered")

app.include_router(
    search.router,
    prefix="/api/v1",
    tags=["search"]
)

app.include_router(
    build_prompt.router,
    prefix="/api/v1",
    tags=["prompting"]
)

# ============================================
# Root Endpoint
# ============================================
@app.get("/")
async def root():
    """Root endpoint"""
    logger.debug("📨 Root endpoint called")
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
    logger.info("=" * 60)
    logger.info("🚀 AI SERVICE STARTUP COMPLETE")
    logger.info("   Service: DocMinr.ai AI Service")
    logger.info("   Version: v1")
    logger.info("   Environment: development")
    logger.info(f"   Backend URL: {settings.BACKEND_API_URL}")
    logger.info("   ✅ Service ready to accept requests")
    logger.info("=" * 60)
    logger.info("📋 Available Endpoints:")
    logger.info("   - GET  /api/v1/health  (Health check)")
    logger.info("   - POST /api/v1/process (Process document)")
    logger.info("   - GET  /               (Root info)")
    logger.info("=" * 60)

@app.on_event("shutdown")
async def shutdown_event():
    """Run when service stops"""
    logger.info("🛑 Shutting down AI Service...")

# ============================================
# Main entry point
# ============================================
if __name__ == "__main__":
    import uvicorn
    logger.info(f"🚀 Starting uvicorn server on {settings.HOST}:{settings.PORT}")
    logger.info(f"   Debug mode: {settings.DEBUG}")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    )