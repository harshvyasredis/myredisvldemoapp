from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List
import os
import uuid
from app.services.document_service import DocumentService
from app.models.document import DocumentResponse, DocumentUploadResponse

router = APIRouter()
document_service = DocumentService()

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    openai_api_key: str = Form(...)
):
    """Upload and process a document for vector search"""
    try:
        # Validate file type
        allowed_types = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file.content_type} not supported. Supported types: PDF, TXT, DOCX"
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{file_id}{file_extension}"
        
        # Save file temporarily
        file_path = f"uploads/{filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process document and create embeddings
        result = await document_service.process_document(
            file_path=file_path,
            original_filename=file.filename,
            file_id=file_id,
            openai_api_key=openai_api_key
        )
        
        # Clean up temporary file
        os.remove(file_path)
        
        return DocumentUploadResponse(
            file_id=file_id,
            filename=file.filename,
            status="processed",
            chunks_created=result["chunks_created"],
            message="Document successfully processed and indexed"
        )
        
    except Exception as e:
        # Clean up file if it exists
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[DocumentResponse])
async def list_documents():
    """List all processed documents"""
    try:
        documents = await document_service.list_documents()
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{file_id}")
async def delete_document(file_id: str):
    """Delete a document and its embeddings"""
    try:
        result = await document_service.delete_document(file_id)
        if not result:
            raise HTTPException(status_code=404, detail="Document not found")
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
