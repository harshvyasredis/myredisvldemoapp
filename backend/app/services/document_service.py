import os
import uuid
from typing import List, Dict, Any
from datetime import datetime
import PyPDF2
import docx
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv
from app.services.redis_service import get_redis_client, get_vector_index
from app.models.document import DocumentResponse
import logging

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self):
        self.redis_client = get_redis_client()
        self.vector_index = get_vector_index()
        self.chunk_size = 1000  # Characters per chunk
        self.chunk_overlap = 200  # Overlap between chunks
    
    async def process_document(self, file_path: str, original_filename: str, file_id: str, openai_api_key: str) -> Dict[str, Any]:
        """Process a document: extract text, create chunks, generate embeddings, and store in Redis"""
        try:
            # Extract text from document
            text_content = self._extract_text(file_path)
            
            # Split text into chunks
            chunks = self._create_chunks(text_content)
            
            # Generate embeddings and store in Redis
            chunks_created = 0
            for i, chunk in enumerate(chunks):
                chunk_id = f"{file_id}_{i}"
                
                # Generate embedding
                embedding = await self._generate_embedding(chunk, openai_api_key)
                
                # Store in Redis
                await self._store_chunk(
                    chunk_id=chunk_id,
                    file_id=file_id,
                    filename=original_filename,
                    content=chunk,
                    chunk_index=i,
                    embedding=embedding
                )
                chunks_created += 1
            
            # Store document metadata
            await self._store_document_metadata(
                file_id=file_id,
                filename=original_filename,
                chunks_count=chunks_created
            )
            
            logger.info(f"Processed document {original_filename} with {chunks_created} chunks")
            return {"chunks_created": chunks_created}
            
        except Exception as e:
            logger.error(f"Error processing document {original_filename}: {e}")
            raise
    
    def _extract_text(self, file_path: str) -> str:
        """Extract text from various file formats"""
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.pdf':
            return self._extract_pdf_text(file_path)
        elif file_extension == '.docx':
            return self._extract_docx_text(file_path)
        elif file_extension == '.txt':
            return self._extract_txt_text(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text.strip()
    
    def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        doc = docx.Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    
    def _extract_txt_text(self, file_path: str) -> str:
        """Extract text from TXT file"""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read().strip()
    
    def _create_chunks(self, text: str) -> List[str]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            # If we're not at the end, try to break at a sentence or word boundary
            if end < len(text):
                # Look for sentence boundary
                sentence_end = text.rfind('.', start, end)
                if sentence_end > start:
                    end = sentence_end + 1
                else:
                    # Look for word boundary
                    word_end = text.rfind(' ', start, end)
                    if word_end > start:
                        end = word_end
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            start = end - self.chunk_overlap
            if start >= len(text):
                break
        
        return chunks
    
    async def _generate_embedding(self, text: str, openai_api_key: str) -> List[float]:
        """Generate embedding using OpenAI API"""
        try:
            openai_client = OpenAI(api_key=openai_api_key)
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    async def _store_chunk(self, chunk_id: str, file_id: str, filename: str,
                          content: str, chunk_index: int, embedding: List[float]):
        """Store document chunk with embedding in Redis"""
        try:
            # Convert embedding to bytes for Hash storage in Redis
            # RedisVL requires vectors to be stored as byte strings for Hash storage
            embedding_bytes = np.array(embedding, dtype=np.float32).tobytes()

            # Store in vector index
            self.vector_index.load([{
                "id": chunk_id,
                "file_id": file_id,
                "filename": filename,
                "content": content,
                "chunk_index": chunk_index,
                "embedding": embedding_bytes
            }])

        except Exception as e:
            logger.error(f"Error storing chunk {chunk_id}: {e}")
            raise
    
    async def _store_document_metadata(self, file_id: str, filename: str, chunks_count: int):
        """Store document metadata in Redis"""
        try:
            metadata = {
                "file_id": file_id,
                "filename": filename,
                "upload_date": datetime.now().isoformat(),
                "chunks_count": chunks_count,
                "status": "processed"
            }
            
            self.redis_client.hset(f"document:{file_id}", mapping=metadata)
            self.redis_client.sadd("documents", file_id)
            
        except Exception as e:
            logger.error(f"Error storing document metadata for {file_id}: {e}")
            raise
    
    async def list_documents(self) -> List[DocumentResponse]:
        """List all processed documents"""
        try:
            document_ids = self.redis_client.smembers("documents")
            documents = []
            
            for doc_id in document_ids:
                metadata = self.redis_client.hgetall(f"document:{doc_id}")
                if metadata:
                    documents.append(DocumentResponse(
                        file_id=metadata["file_id"],
                        filename=metadata["filename"],
                        upload_date=datetime.fromisoformat(metadata["upload_date"]),
                        chunks_count=int(metadata["chunks_count"]),
                        status=metadata["status"]
                    ))
            
            return sorted(documents, key=lambda x: x.upload_date, reverse=True)
            
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            raise
    
    async def delete_document(self, file_id: str) -> bool:
        """Delete a document and all its chunks"""
        try:
            # Check if document exists
            if not self.redis_client.sismember("documents", file_id):
                return False
            
            # Get document metadata to find chunk count
            metadata = self.redis_client.hgetall(f"document:{file_id}")
            if not metadata:
                return False
            
            chunks_count = int(metadata.get("chunks_count", 0))
            
            # Delete all chunks from vector index
            chunk_ids = [f"{file_id}_{i}" for i in range(chunks_count)]
            for chunk_id in chunk_ids:
                try:
                    self.redis_client.delete(f"doc:{chunk_id}")
                except:
                    pass  # Continue even if some chunks don't exist
            
            # Delete document metadata
            self.redis_client.delete(f"document:{file_id}")
            self.redis_client.srem("documents", file_id)
            
            logger.info(f"Deleted document {file_id} with {chunks_count} chunks")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document {file_id}: {e}")
            raise
