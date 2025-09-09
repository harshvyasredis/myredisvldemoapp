from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentResponse(BaseModel):
    file_id: str
    filename: str
    upload_date: datetime
    chunks_count: int
    status: str

class DocumentUploadResponse(BaseModel):
    file_id: str
    filename: str
    status: str
    chunks_created: int
    message: str

class DocumentChunk(BaseModel):
    chunk_id: str
    file_id: str
    content: str
    chunk_index: int
    embedding: Optional[list] = None
