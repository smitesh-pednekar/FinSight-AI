"""Semantic search service using embeddings and pgvector."""

import logging
from typing import Optional
from uuid import UUID

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import DocumentChunk, Document

logger = logging.getLogger(__name__)
settings = get_settings()


class SemanticSearchService:
    """Semantic search using embeddings and vector similarity."""
    
    def __init__(self):
        """Initialize semantic search service."""
        if settings.google_api_key:
            logger.info("Initializing Google Gemini Embeddings")
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="text-embedding-004",
                google_api_key=settings.google_api_key,
            )
        else:
            logger.info("Initializing OpenAI Embeddings")
            self.embeddings = OpenAIEmbeddings(
                model=settings.embedding_model,
                openai_api_key=settings.openai_api_key,
            )
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ".", " ", ""],
        )
    
    async def create_chunks_and_embeddings(
        self,
        db: AsyncSession,
        document_id: UUID,
        document_text: str,
        metadata: Optional[dict] = None
    ) -> int:
        """
        Create text chunks and generate embeddings for a document.
        
        Args:
            db: Database session
            document_id: Document UUID
            document_text: Full text of document
            metadata: Optional metadata for chunks
            
        Returns:
            Number of chunks created
        """
        if not document_text or not document_text.strip():
            logger.warning(f"Empty document text for document {document_id}")
            return 0
        
        # Split text into chunks
        chunks = self.text_splitter.split_text(document_text)
        
        logger.info(f"Created {len(chunks)} chunks for document {document_id}")
        
        # Generate embeddings for all chunks
        try:
            embeddings = await self.embeddings.aembed_documents(chunks)
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise
        
        # Store chunks in database
        chunk_objects = []
        for idx, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_obj = DocumentChunk(
                document_id=document_id,
                chunk_text=chunk_text,
                chunk_index=idx,
                embedding=embedding,
                chunk_metadata=metadata or {},
            )
            chunk_objects.append(chunk_obj)
        
        db.add_all(chunk_objects)
        await db.commit()
        
        logger.info(f"Stored {len(chunk_objects)} chunks for document {document_id}")
        
        return len(chunk_objects)
    
    async def search(
        self,
        db: AsyncSession,
        query: str,
        top_k: int = 5,
        document_type: Optional[str] = None,
        user_id: Optional[UUID] = None
    ) -> list[dict]:
        """
        Perform semantic search across document chunks.
        
        Args:
            db: Database session
            query: Search query
            top_k: Number of results to return
            document_type: Optional filter by document type
            user_id: Optional filter by user
            
        Returns:
            List of search results with similarity scores
        """
        # Generate query embedding
        try:
            query_embedding = await self.embeddings.aembed_query(query)
        except Exception as e:
            logger.error(f"Error generating query embedding: {str(e)}")
            raise
        
        # Build the similarity search query
        # Using cosine distance (1 - cosine similarity)
        base_query = """
        SELECT 
            dc.id,
            dc.document_id,
            dc.chunk_text,
            dc.chunk_index,
            dc.page_number,
            dc.chunk_metadata,
            d.filename,
            d.document_type,
            1 - (dc.embedding <=> :query_embedding) as similarity_score
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE 1=1
        """
        
        params = {"query_embedding": query_embedding}
        
        if document_type:
            base_query += " AND d.document_type = :document_type"
            params["document_type"] = document_type
        
        if user_id:
            base_query += " AND d.user_id = :user_id"
            params["user_id"] = str(user_id)
        
        base_query += """
        ORDER BY dc.embedding <=> :query_embedding
        LIMIT :top_k
        """
        params["top_k"] = top_k
        
        # Execute search
        result = await db.execute(text(base_query), params)
        rows = result.fetchall()
        
        # Format results
        search_results = []
        for row in rows:
            search_results.append({
                "chunk_id": row[0],
                "document_id": row[1],
                "chunk_text": row[2],
                "chunk_index": row[3],
                "page_number": row[4],
                "metadata": row[5],
                "document_filename": row[6],
                "document_type": row[7],
                "similarity_score": float(row[8]),
            })
        
        logger.info(f"Semantic search returned {len(search_results)} results for query: {query}")
        
        return search_results
    
    async def delete_chunks_for_document(
        self,
        db: AsyncSession,
        document_id: UUID
    ) -> int:
        """
        Delete all chunks for a document.
        
        Args:
            db: Database session
            document_id: Document UUID
            
        Returns:
            Number of chunks deleted
        """
        # Get count first
        count_result = await db.execute(
            select(DocumentChunk).where(DocumentChunk.document_id == document_id)
        )
        chunks = count_result.scalars().all()
        count = len(chunks)
        
        # Delete chunks
        for chunk in chunks:
            await db.delete(chunk)
        
        await db.commit()
        
        logger.info(f"Deleted {count} chunks for document {document_id}")
        
        return count
