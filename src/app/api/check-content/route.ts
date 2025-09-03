import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Get all documents with content preview
    const documents = await sql`
      SELECT 
        id, 
        title, 
        file_name,
        file_type,
        file_size,
        source_type,
        LENGTH(content) as content_length,
        LEFT(content, 200) as content_preview,
        created_at
      FROM documents 
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    // Get chunk counts for each document
    const chunkCounts = await sql`
      SELECT 
        document_id, 
        COUNT(*) as chunk_count,
        SUM(LENGTH(content)) as total_chunk_length
      FROM document_chunks 
      GROUP BY document_id
    `;
    
    // Combine the data
    const documentsWithChunks = documents.map(doc => {
      const chunkInfo = chunkCounts.find(c => c.document_id === doc.id);
      return {
        ...doc,
        chunk_count: chunkInfo?.chunk_count || 0,
        total_chunk_length: chunkInfo?.total_chunk_length || 0
      };
    });
    
    return NextResponse.json({
      success: true,
      documents: documentsWithChunks,
      summary: {
        total_documents: documents.length,
        documents_with_content: documents.filter(d => d.content_length > 0).length,
        documents_without_content: documents.filter(d => d.content_length === 0 || d.content_length === null).length
      }
    });
  } catch (error) {
    console.error('Error checking content:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}