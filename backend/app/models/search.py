from pydantic import BaseModel, Field
from typing import List, Optional

class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    openai_api_key: str = Field(..., description="OpenAI API key for generating query embeddings")
    limit: int = Field(10, ge=1, le=50, description="Number of results to return")
    threshold: float = Field(0.7, ge=0.0, le=1.0, description="Similarity threshold")
    file_ids: Optional[List[str]] = Field(None, description="Specific file IDs to search within")

class SearchResponse(BaseModel):
    chunk_id: str
    file_id: str
    filename: str
    content: str
    similarity_score: float
    chunk_index: int
