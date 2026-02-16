"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# User Schemas
class UserBase(BaseModel):
    """Base user schema."""
    email: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema."""
    password: str


class UserResponse(UserBase):
    """User response schema."""
    id: UUID
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}


# Document Schemas
class DocumentUploadResponse(BaseModel):
    """Response after document upload."""
    id: UUID
    filename: str
    status: str
    created_at: datetime
    
    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    """Detailed document response."""
    id: UUID
    user_id: UUID
    filename: str
    original_filename: str
    file_size: int
    mime_type: Optional[str]
    status: str
    document_type: str
    page_count: Optional[int]
    processing_started_at: Optional[datetime]
    processing_completed_at: Optional[datetime]
    error_message: Optional[str]
    retry_count: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    """List of documents with pagination."""
    documents: list[DocumentResponse]
    total: int
    page: int
    page_size: int


# Financial Extraction Schemas
class FinancialExtractionResponse(BaseModel):
    """Financial extraction response."""
    id: UUID
    document_id: UUID
    extracted_data: dict[str, Any]
    confidence_score: Optional[float]
    invoice_number: Optional[str]
    invoice_date: Optional[datetime]
    due_date: Optional[datetime]
    vendor_name: Optional[str]
    customer_name: Optional[str]
    subtotal: Optional[float]
    tax_amount: Optional[float]
    total_amount: Optional[float]
    currency: str
    extraction_method: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}


# Validation Schemas
class ValidationResponse(BaseModel):
    """Financial validation response."""
    id: UUID
    document_id: UUID
    validation_type: str
    is_valid: bool
    expected_value: Optional[dict[str, Any]]
    actual_value: Optional[dict[str, Any]]
    error_message: Optional[str]
    severity: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}


# Risk Flag Schemas
class RiskFlagResponse(BaseModel):
    """Risk flag response."""
    id: UUID
    document_id: UUID
    risk_type: str
    risk_level: str
    description: str
    ai_explanation: Optional[str]
    evidence: Optional[dict[str, Any]]
    is_resolved: bool
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}


# Complete Document Response
class DocumentDetailResponse(DocumentResponse):
    """Document with all related data."""
    extractions: list[FinancialExtractionResponse] = []
    validations: list[ValidationResponse] = []
    risk_flags: list[RiskFlagResponse] = []


# Search Schemas
class SearchRequest(BaseModel):
    """Semantic search request."""
    query: str = Field(..., min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=50)
    document_type: Optional[str] = None
    min_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class SearchResult(BaseModel):
    """Single search result."""
    document_id: UUID
    chunk_text: str
    similarity_score: float
    document_filename: str
    document_type: str
    page_number: Optional[int]
    metadata: Optional[dict[str, Any]]


class SearchResponse(BaseModel):
    """Search results response."""
    results: list[SearchResult]
    query: str
    total_results: int


# Alert Schemas
class AlertResponse(BaseModel):
    """Alert/risk flag for dashboard."""
    id: UUID
    document_id: UUID
    document_filename: str
    risk_type: str
    risk_level: str
    description: str
    created_at: datetime
    is_resolved: bool


class AlertsListResponse(BaseModel):
    """List of alerts."""
    alerts: list[AlertResponse]
    total: int


# Report Schemas
class ReportRequest(BaseModel):
    """Report generation request."""
    document_id: UUID
    include_extractions: bool = True
    include_validations: bool = True
    include_risks: bool = True


class ReportResponse(BaseModel):
    """Generated report."""
    document: DocumentResponse
    extractions: list[FinancialExtractionResponse]
    validations: list[ValidationResponse]
    risk_flags: list[RiskFlagResponse]
    generated_at: datetime


# Audit Log Schemas
class AuditLogResponse(BaseModel):
    """Audit log entry."""
    id: UUID
    user_id: Optional[UUID] = None
    document_id: Optional[UUID] = None
    action: str
    resource_type: str
    resource_id: Optional[UUID] = None
    description: Optional[str] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    """List of audit logs with pagination."""
    logs: list[AuditLogResponse]
    total: int


# Error Schemas
class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
