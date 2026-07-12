"""
Health Check Routes
"""
from fastapi import APIRouter, status
from datetime import datetime
import sys

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    Returns service status and basic info.
    """
    return {
        "success": True,
        "service": "DocMinr.ai AI Service",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "python_version": sys.version.split()[0],
        "version": "v1"
    }

@router.get("/ready")
async def readiness_check():
    """
    Readiness check for Docker health checks.
    """
    return {
        "success": True,
        "status": "ready"
    }