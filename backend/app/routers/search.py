from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services.search_service import SearchService
from app.models.search import SearchRequest, SearchResponse

router = APIRouter()
search_service = SearchService()

@router.get("/", response_model=List[SearchResponse])
async def search_documents(
    query: str = Query(..., description="Search query"),
    openai_api_key: str = Query(..., description="OpenAI API key for generating query embeddings"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return"),
    threshold: float = Query(0.7, ge=0.0, le=1.0, description="Similarity threshold")
):
    """Perform semantic search across all documents"""
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        results = await search_service.search(
            query=query.strip(),
            openai_api_key=openai_api_key,
            limit=limit,
            threshold=threshold,
            file_ids=None
        )
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=List[SearchResponse])
async def search_documents_post(request: SearchRequest):
    """Perform semantic search with POST request (for complex queries)"""
    try:
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        results = await search_service.search(
            query=request.query.strip(),
            openai_api_key=request.openai_api_key,
            limit=request.limit,
            threshold=request.threshold,
            file_ids=request.file_ids
        )
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
