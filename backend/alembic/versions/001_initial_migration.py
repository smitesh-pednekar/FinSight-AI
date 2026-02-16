"""Initial migration - create all tables.

Revision ID: 001
Revises: 
Create Date: 2026-02-14 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all tables and pgvector extension."""
    # Enable pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Create documents table
    op.create_table(
        'documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('filename', sa.String(length=500), nullable=False),
        sa.Column('original_filename', sa.String(length=500), nullable=False),
        sa.Column('file_path', sa.String(length=1000), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(length=100)),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('document_type', sa.String(length=50)),
        sa.Column('extracted_text', sa.Text()),
        sa.Column('page_count', sa.Integer()),
        sa.Column('processing_started_at', sa.DateTime()),
        sa.Column('processing_completed_at', sa.DateTime()),
        sa.Column('error_message', sa.Text()),
        sa.Column('retry_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_document_user_status', 'documents', ['user_id', 'status'])
    op.create_index('idx_document_type', 'documents', ['document_type'])
    op.create_index(op.f('ix_documents_created_at'), 'documents', ['created_at'])
    
    # Create financial_extractions table
    op.create_table(
        'financial_extractions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('extracted_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('confidence_score', sa.Float()),
        sa.Column('invoice_number', sa.String(length=100)),
        sa.Column('invoice_date', sa.DateTime()),
        sa.Column('due_date', sa.DateTime()),
        sa.Column('vendor_name', sa.String(length=255)),
        sa.Column('customer_name', sa.String(length=255)),
        sa.Column('subtotal', sa.Float()),
        sa.Column('tax_amount', sa.Float()),
        sa.Column('total_amount', sa.Float()),
        sa.Column('currency', sa.String(length=10)),
        sa.Column('extraction_method', sa.String(length=50)),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_extraction_invoice_num', 'financial_extractions', ['invoice_number'])
    op.create_index('idx_extraction_vendor', 'financial_extractions', ['vendor_name'])
    op.create_index('idx_extraction_date', 'financial_extractions', ['invoice_date'])
    
    # Create financial_validations table
    op.create_table(
        'financial_validations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('validation_type', sa.String(length=100), nullable=False),
        sa.Column('is_valid', sa.Boolean(), nullable=False),
        sa.Column('expected_value', postgresql.JSONB(astext_type=sa.Text())),
        sa.Column('actual_value', postgresql.JSONB(astext_type=sa.Text())),
        sa.Column('error_message', sa.Text()),
        sa.Column('severity', sa.String(length=50)),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_validation_type', 'financial_validations', ['validation_type'])
    op.create_index('idx_validation_status', 'financial_validations', ['is_valid'])
    
    # Create risk_flags table
    op.create_table(
        'risk_flags',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('risk_type', sa.String(length=100), nullable=False),
        sa.Column('risk_level', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('ai_explanation', sa.Text()),
        sa.Column('evidence', postgresql.JSONB(astext_type=sa.Text())),
        sa.Column('is_resolved', sa.Boolean(), default=False),
        sa.Column('resolved_at', sa.DateTime()),
        sa.Column('resolution_notes', sa.Text()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_risk_level', 'risk_flags', ['risk_level'])
    op.create_index('idx_risk_type', 'risk_flags', ['risk_type'])
    op.create_index('idx_risk_resolved', 'risk_flags', ['is_resolved'])
    op.create_index(op.f('ix_risk_flags_created_at'), 'risk_flags', ['created_at'])
    
    # Create document_chunks table with vector column
    op.create_table(
        'document_chunks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('chunk_text', sa.Text(), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('page_number', sa.Integer()),
        sa.Column('chunk_metadata', postgresql.JSONB(astext_type=sa.Text())),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add vector column separately (pgvector)
    # Changed from 1536 to 768 to match Google Gemini embeddings
    op.execute('ALTER TABLE document_chunks ADD COLUMN embedding vector(768)')
    op.create_index('idx_chunk_document', 'document_chunks', ['document_id', 'chunk_index'])
    
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True)),
        sa.Column('document_id', postgresql.UUID(as_uuid=True)),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=50), nullable=False),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True)),
        sa.Column('description', sa.Text()),
        sa.Column('changes', postgresql.JSONB(astext_type=sa.Text())),
        sa.Column('ip_address', sa.String(length=50)),
        sa.Column('user_agent', sa.String(length=500)),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_audit_action', 'audit_logs', ['action', 'created_at'])
    op.create_index('idx_audit_resource', 'audit_logs', ['resource_type', 'resource_id'])
    
    # Insert demo user
    op.execute("""
        INSERT INTO users (id, email, hashed_password, full_name, is_active, created_at, updated_at)
        VALUES (
            '00000000-0000-0000-0000-000000000001',
            'demo@finsight.ai',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS6NkUgL.',
            'Demo User',
            true,
            NOW(),
            NOW()
        )
    """)


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table('audit_logs')
    op.drop_table('document_chunks')
    op.drop_table('risk_flags')
    op.drop_table('financial_validations')
    op.drop_table('financial_extractions')
    op.drop_table('documents')
    op.drop_table('users')
    op.execute('DROP EXTENSION IF EXISTS vector')
