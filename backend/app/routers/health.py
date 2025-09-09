from fastapi import APIRouter, HTTPException
from app.services.redis_service import get_redis_client
import redis

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint that verifies Redis connectivity"""
    try:
        redis_client = get_redis_client()
        # Test Redis connection
        redis_client.ping()
        
        return {
            "status": "healthy",
            "redis": "connected",
            "message": "All services are operational"
        }
    except redis.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Redis connection failed"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )
