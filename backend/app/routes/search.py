"""API routes for semantic search."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import SearchRequest, SearchResponse, SearchResult
from app.services.semantic_search import SemanticSearchService

router = APIRouter(tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def semantic_search(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Perform semantic search across all documents.
    
    - Uses AI embeddings for natural language queries
    - Returns relevant document chunks with similarity scores
    - Example queries:
        - "Invoices above $100,000 last quarter"
        - "Show risky vendors"
        - "Bank statements with negative balances"
    """
    search_service = SemanticSearchService()
    
    try:
        results = await search_service.search(
            db=db,
            query=request.query,
            top_k=request.top_k,
            document_type=request.document_type,
        )
        
        # Convert to response format
        search_results = []
        for result in results:
            search_results.append(SearchResult(
                document_id=result["document_id"],
                chunk_text=result["chunk_text"],
                similarity_score=result["similarity_score"],
                document_filename=result["document_filename"],
                document_type=result["document_type"],
                page_number=result.get("page_number"),
                metadata=result.get("metadata"),
            ))
        
        return SearchResponse(
            results=search_results,
            query=request.query,
            total_results=len(search_results)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
