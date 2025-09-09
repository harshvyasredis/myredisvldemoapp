import os
from typing import List, Optional
from openai import OpenAI
from redisvl.query import VectorQuery
from app.services.redis_service import get_vector_index
from app.models.search import SearchResponse
import logging

logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self):
        self.vector_index = get_vector_index()
    
    async def search(self, query: str, openai_api_key: str, limit: int = 10, threshold: float = 0.7,
                    file_ids: Optional[List[str]] = None) -> List[SearchResponse]:
        """Perform semantic search across documents"""
        try:
            # Generate embedding for the query
            query_embedding = await self._generate_query_embedding(query, openai_api_key)
            
            # Create vector query
            vector_query = VectorQuery(
                vector=query_embedding,
                vector_field_name="embedding",
                return_fields=["file_id", "filename", "content", "chunk_index"],
                num_results=limit
            )
            
            # Add file filter if specified
            if file_ids:
                file_filter = " | ".join([f"@file_id:{{{file_id}}}" for file_id in file_ids])
                vector_query = vector_query.filter(file_filter)
            
            # Execute search
            results = self.vector_index.query(vector_query)
            
            # Process and filter results
            search_results = []
            for result in results:
                # RedisVL uses 'vector_distance' field, convert to similarity score
                # Lower distance = higher similarity, so we convert: similarity = 1 - distance
                vector_distance = float(result.get("vector_distance", 1.0))
                similarity_score = 1.0 - vector_distance

                # Apply similarity threshold
                if similarity_score >= threshold:
                    search_results.append(SearchResponse(
                        chunk_id=result["id"],
                        file_id=result["file_id"],
                        filename=result["filename"],
                        content=result["content"],
                        similarity_score=similarity_score,
                        chunk_index=int(result["chunk_index"])
                    ))
            
            # Sort by similarity score (descending)
            search_results.sort(key=lambda x: x.similarity_score, reverse=True)
            
            logger.info(f"Search query '{query}' returned {len(search_results)} results")
            return search_results
            
        except Exception as e:
            logger.error(f"Error performing search: {e}")
            raise
    
    async def _generate_query_embedding(self, query: str, openai_api_key: str) -> List[float]:
        """Generate embedding for search query"""
        try:
            openai_client = OpenAI(api_key=openai_api_key)
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=query
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating query embedding: {e}")
            raise
