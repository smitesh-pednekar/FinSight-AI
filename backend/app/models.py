"""Database models for FinSight AI."""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Column, String, DateTime, Integer, Float, Boolean,
    ForeignKey, Text, JSON, Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

Base = declarative_base()


class DocumentStatus(str, Enum):
    """Document processing status."""
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class DocumentType(str, Enum):
    """Supported document types."""
    INVOICE = "INVOICE"
    BANK_STATEMENT = "BANK_STATEMENT"
    PROFIT_LOSS = "PROFIT_LOSS"
    BALANCE_SHEET = "BALANCE_SHEET"
    TAX_DOCUMENT = "TAX_DOCUMENT"
    FINANCIAL_CONTRACT = "FINANCIAL_CONTRACT"
    UNKNOWN = "UNKNOWN"


class RiskLevel(str, Enum):
    """Risk assessment levels."""
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class User(Base):
    """User accounts."""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class Document(Base):
    """Uploaded financial documents."""
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # File metadata
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100))
    
    # Processing
    status = Column(String(50), nullable=False, default=DocumentStatus.UPLOADED.value)
    document_type = Column(String(50), default=DocumentType.UNKNOWN.value)
    
    # Text extraction
    extracted_text = Column(Text)
    page_count = Column(Integer)
    
    # Metadata
    processing_started_at = Column(DateTime)
    processing_completed_at = Column(DateTime)
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="documents")
    extractions = relationship("FinancialExtraction", back_populates="document", cascade="all, delete-orphan")
    validations = relationship("FinancialValidation", back_populates="document", cascade="all, delete-orphan")
    risk_flags = relationship("RiskFlag", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="document")
    
    __table_args__ = (
        Index("idx_document_user_status", "user_id", "status"),
        Index("idx_document_type", "document_type"),
    )


class FinancialExtraction(Base):
    """Extracted financial data from documents."""
    __tablename__ = "financial_extractions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    
    # Extraction results
    extracted_data = Column(JSONB, nullable=False)
    confidence_score = Column(Float)
    
    # For invoices
    invoice_number = Column(String(100), index=True)
    invoice_date = Column(DateTime)
    due_date = Column(DateTime)
    vendor_name = Column(String(255), index=True)
    customer_name = Column(String(255))
    
    # Financial amounts
    subtotal = Column(Float)
    tax_amount = Column(Float)
    total_amount = Column(Float)
    currency = Column(String(10), default="USD")
    
    # Metadata
    extraction_method = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="extractions")
    
    __table_args__ = (
        Index("idx_extraction_invoice_num", "invoice_number"),
        Index("idx_extraction_vendor", "vendor_name"),
        Index("idx_extraction_date", "invoice_date"),
    )


class FinancialValidation(Base):
    """Validation results for extracted financial data."""
    __tablename__ = "financial_validations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    
    # Validation results
    validation_type = Column(String(100), nullable=False, index=True)
    is_valid = Column(Boolean, nullable=False)
    
    # Details
    expected_value = Column(JSONB)
    actual_value = Column(JSONB)
    error_message = Column(Text)
    
    # Severity
    severity = Column(String(50))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="validations")
    
    __table_args__ = (
        Index("idx_validation_type", "validation_type"),
        Index("idx_validation_status", "is_valid"),
    )


class RiskFlag(Base):
    """Risk and anomaly flags for documents."""
    __tablename__ = "risk_flags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    
    # Risk details
    risk_type = Column(String(100), nullable=False, index=True)
    risk_level = Column(String(50), nullable=False, default=RiskLevel.LOW.value)
    
    # Explanation
    description = Column(Text, nullable=False)
    ai_explanation = Column(Text)
    
    # Evidence
    evidence = Column(JSONB)
    
    # Resolution
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="risk_flags")
    
    __table_args__ = (
        Index("idx_risk_level", "risk_level"),
        Index("idx_risk_type", "risk_type"),
        Index("idx_risk_resolved", "is_resolved"),
    )


class DocumentChunk(Base):
    """Text chunks for semantic search."""
    __tablename__ = "document_chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    
    # Chunk data
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer)
    
    # Vector embedding (768 dimensions for Google text-embedding-004)
    embedding = Column(Vector(768))
    
    # Metadata
    chunk_metadata = Column(JSONB)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="chunks")
    
    __table_args__ = (
        Index("idx_chunk_document", "document_id", "chunk_index"),
    )


class AuditLog(Base):
    """Audit trail for all financial operations."""
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    
    # Action details
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(UUID(as_uuid=True))
    
    # Context
    description = Column(Text)
    changes = Column(JSONB)
    
    # Request metadata
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    document = relationship("Document", back_populates="audit_logs")
    
    __table_args__ = (
        Index("idx_audit_action", "action", "created_at"),
        Index("idx_audit_resource", "resource_type", "resource_id"),
    )
