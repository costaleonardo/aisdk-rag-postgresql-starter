import { sql, type Document, type DocumentChunk } from './db';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { type ScrapedContent } from './scraper';

export interface SearchResult {
  content: string;
  similarity: number;
  document_id: number;
  chunk_id: number;
  document_title?: string;
  document_url?: string;
}

export interface StoredDocument {
  id: number;
  url?: string;
  title?: string;
  chunksCreated: number;
}

/**
 * Stores a document and its chunks with embeddings in the database
 */
export async function storeDocument(
  content: ScrapedContent | { title: string; content: string; url?: string; metadata?: any },
  chunks: string[]
): Promise<StoredDocument> {
  try {
    // Check if document with URL already exists (if URL provided)
    if ('url' in content && content.url) {
      const existingDoc = await sql`
        SELECT id FROM documents WHERE url = ${content.url}
      `;
      
      if (existingDoc.length > 0) {
        // Delete existing document (cascading deletes will handle chunks)
        await sql`
          DELETE FROM documents WHERE url = ${content.url}
        `;
      }
    }
    
    // Prepare metadata
    const metadata = 'metadata' in content ? content.metadata : {};
    
    // Insert document
    const [document] = await sql`
      INSERT INTO documents (url, title, content, metadata)
      VALUES (
        ${content.url || null}, 
        ${content.title}, 
        ${content.content},
        ${JSON.stringify(metadata)}
      )
      RETURNING id, url, title
    `;
    
    if (!document) {
      throw new Error('Failed to insert document');
    }
    
    let chunksCreated = 0;
    
    // Generate and store embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      if (!chunk.trim()) {
        continue; // Skip empty chunks
      }
      
      try {
        // Generate embedding using OpenAI
        const { embedding } = await embed({
          model: openai.embedding('text-embedding-ada-002'),
          value: chunk
        });
        
        // Store chunk with embedding
        await sql`
          INSERT INTO document_chunks (document_id, content, embedding, chunk_index)
          VALUES (
            ${document.id}, 
            ${chunk}, 
            ${JSON.stringify(embedding)}::vector,
            ${i}
          )
        `;
        
        chunksCreated++;
      } catch (error) {
        console.error(`Failed to process chunk ${i}:`, error);
        // Continue with other chunks even if one fails
      }
    }
    
    if (chunksCreated === 0) {
      // Clean up document if no chunks were created
      await sql`DELETE FROM documents WHERE id = ${document.id}`;
      throw new Error('Failed to create any chunks for document');
    }
    
    return {
      id: document.id,
      url: document.url,
      title: document.title,
      chunksCreated
    };
  } catch (error) {
    throw new Error(`Failed to store document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Performs vector similarity search on stored documents
 */
export async function vectorSearch(
  query: string, 
  limit: number = 5,
  similarityThreshold: number = 0.7
): Promise<SearchResult[]> {
  try {
    if (!query.trim()) {
      return [];
    }
    
    // Generate query embedding
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-ada-002'),
      value: query
    });
    
    // Search for similar chunks
    const results = await sql`
      SELECT 
        dc.id as chunk_id,
        dc.document_id,
        dc.content,
        d.title as document_title,
        d.url as document_url,
        1 - (dc.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE 1 - (dc.embedding <=> ${JSON.stringify(embedding)}::vector) > ${similarityThreshold}
      ORDER BY dc.embedding <=> ${JSON.stringify(embedding)}::vector
      LIMIT ${limit}
    `;
    
    return results.map((item: any) => ({
      chunk_id: item.chunk_id,
      document_id: item.document_id,
      content: item.content,
      document_title: item.document_title,
      document_url: item.document_url,
      similarity: parseFloat(item.similarity)
    }));
  } catch (error) {
    console.error('Vector search error:', error);
    throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets a document by ID
 */
export async function getDocumentById(documentId: number): Promise<Document | null> {
  try {
    const result = await sql`
      SELECT * FROM documents WHERE id = ${documentId}
    `;
    return result.length > 0 ? result[0] as Document : null;
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
}

/**
 * Gets all documents with pagination
 */
export async function getAllDocuments(limit: number = 50, offset: number = 0): Promise<Document[]> {
  try {
    const documents = await sql`
      SELECT * FROM documents 
      ORDER BY created_at DESC 
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    return documents as Document[];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

/**
 * Deletes a document and its chunks
 */
export async function deleteDocument(documentId: number): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM documents WHERE id = ${documentId}
    `;
    return (result as any).count > 0;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
}

/**
 * Gets chunks for a specific document
 */
export async function getDocumentChunks(documentId: number): Promise<DocumentChunk[]> {
  try {
    const chunks = await sql`
      SELECT * FROM document_chunks 
      WHERE document_id = ${documentId}
      ORDER BY chunk_index
    `;
    return chunks as DocumentChunk[];
  } catch (error) {
    console.error('Error fetching document chunks:', error);
    return [];
  }
}

/**
 * Full-text search on documents (requires GIN index)
 */
export async function fullTextSearch(
  query: string,
  limit: number = 10
): Promise<Document[]> {
  try {
    const documents = await sql`
      SELECT * FROM documents
      WHERE to_tsvector('english', content) @@ plainto_tsquery('english', ${query})
      OR to_tsvector('english', title) @@ plainto_tsquery('english', ${query})
      ORDER BY ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) DESC
      LIMIT ${limit}
    `;
    return documents as Document[];
  } catch (error) {
    console.error('Full-text search error:', error);
    return [];
  }
}

/**
 * Test vector store functionality
 */
export async function testVectorStore(): Promise<void> {
  try {
    console.log('Testing vector store connection...');
    
    // Test database connectivity
    const testQuery = await sql`SELECT 1 as test`;
    console.log('Database connection: OK');
    
    // Test vector extension
    const vectorTest = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as vector_enabled
    `;
    console.log('Vector extension:', vectorTest[0].vector_enabled ? 'OK' : 'NOT INSTALLED');
    
    // Test embedding generation
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-ada-002'),
      value: 'test embedding'
    });
    console.log('Embedding generation: OK', `(${embedding.length} dimensions)`);
    
    console.log('Vector store test completed successfully');
  } catch (error) {
    console.error('Vector store test failed:', error);
    throw error;
  }
}