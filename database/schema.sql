-- AI SDK RAG PostgreSQL Starter - Database Schema
-- Simple schema for RAG (Retrieval Augmented Generation) applications
-- Uses PostgreSQL with pgvector extension for vector similarity search

-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Main documents table - stores the original content
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    url TEXT UNIQUE,  -- Optional: URL if content was scraped from web
    title VARCHAR(512),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',  -- Flexible JSON field for custom metadata
    file_name TEXT,  -- Name of uploaded file
    file_type VARCHAR(50),  -- Type of file (pdf, docx, txt, md, csv)
    file_size INTEGER,  -- Size of file in bytes
    source_type VARCHAR(20) DEFAULT 'text',  -- Source type: 'text', 'url', or 'file'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Document chunks table - stores text chunks with their embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI text-embedding-ada-002 dimensions
    chunk_index INTEGER DEFAULT 0,  -- Order of chunk in original document
    metadata JSONB DEFAULT '{}',  -- Optional metadata for chunks
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks 
    USING hnsw (embedding vector_cosine_ops);  -- HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN (metadata);

-- Optional: Add full-text search capabilities
CREATE INDEX IF NOT EXISTS idx_documents_content_fts ON documents 
    USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_documents_title_fts ON documents 
    USING GIN (to_tsvector('english', title));

-- Helper function to search documents by similarity
CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 5,
    similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE(
    chunk_id BIGINT,
    document_id BIGINT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id as chunk_id,
        dc.document_id,
        dc.content,
        1 - (dc.embedding <=> query_embedding) as similarity
    FROM document_chunks dc
    WHERE 1 - (dc.embedding <=> query_embedding) > similarity_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;