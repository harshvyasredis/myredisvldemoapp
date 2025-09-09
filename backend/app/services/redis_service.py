import os
import redis
from redisvl.index import SearchIndex
from redisvl.query import VectorQuery
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.index: Optional[SearchIndex] = None
        self._connect()
    
    def _connect(self):
        """Initialize Redis connection and vector index"""
        try:
            # Get Redis connection details from environment
            redis_url = os.getenv("REDIS_URL")
            if redis_url:
                self.client = redis.from_url(redis_url, decode_responses=True)
            else:
                self.client = redis.Redis(
                    host=os.getenv("REDIS_HOST", "localhost"),
                    port=int(os.getenv("REDIS_PORT", 6379)),
                    password=os.getenv("REDIS_PASSWORD"),
                    decode_responses=True
                )
            
            # Test connection
            self.client.ping()
            logger.info("Successfully connected to Redis")
            
            # Initialize vector index
            self._setup_vector_index()
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    def _setup_vector_index(self):
        """Set up the vector index for document embeddings"""
        try:
            # Define the index schema
            schema = {
                "index": {
                    "name": "document_embeddings",
                    "prefix": "doc:",
                    "storage_type": "hash"
                },
                "fields": [
                    {
                        "name": "file_id",
                        "type": "tag"
                    },
                    {
                        "name": "filename",
                        "type": "text"
                    },
                    {
                        "name": "content",
                        "type": "text"
                    },
                    {
                        "name": "chunk_index",
                        "type": "numeric"
                    },
                    {
                        "name": "embedding",
                        "type": "vector",
                        "attrs": {
                            "dims": 1536,  # OpenAI embedding dimension
                            "distance_metric": "cosine",
                            "algorithm": "hnsw",
                            "initial_cap": 400  # Adjusted for Redis Cloud free tier
                        }
                    }
                ]
            }

            # Create Redis URL - ensure proper format for RedisVL
            redis_url = os.getenv("REDIS_URL")
            if not redis_url:
                host = os.getenv('REDIS_HOST', 'localhost')
                port = os.getenv('REDIS_PORT', '6379')
                password = os.getenv('REDIS_PASSWORD', '')
                if password:
                    redis_url = f"redis://default:{password}@{host}:{port}"
                else:
                    redis_url = f"redis://{host}:{port}"

            logger.info(f"Creating SearchIndex with URL: {redis_url[:30]}...")

            # Create or get existing index
            self.index = SearchIndex.from_dict(schema, redis_url=redis_url)

            # Create index if it doesn't exist
            try:
                self.index.create(overwrite=False)
                logger.info("Vector index created successfully")
            except Exception as e:
                if "Index already exists" in str(e):
                    logger.info("Vector index already exists")
                else:
                    raise

        except Exception as e:
            logger.error(f"Failed to setup vector index: {e}")
            raise
    
    def get_client(self) -> redis.Redis:
        """Get Redis client instance"""
        if not self.client:
            self._connect()
        return self.client
    
    def get_index(self) -> SearchIndex:
        """Get vector index instance"""
        if not self.index:
            self._setup_vector_index()
        return self.index

# Global Redis service instance
_redis_service = None

def get_redis_service() -> RedisService:
    """Get or create Redis service singleton"""
    global _redis_service
    if _redis_service is None:
        _redis_service = RedisService()
    return _redis_service

def get_redis_client() -> redis.Redis:
    """Get Redis client"""
    return get_redis_service().get_client()

def get_vector_index() -> SearchIndex:
    """Get vector index"""
    return get_redis_service().get_index()
