import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Get all documents with detailed information
    const documents = await sql`
      SELECT 
        d.id,
        d.title,
        d.file_name,
        d.file_type,
        d.file_size,
        d.source_type,
        d.metadata,
        d.created_at,
        d.updated_at,
        COUNT(dc.id) as chunk_count
      FROM documents d
      LEFT JOIN document_chunks dc ON d.id = dc.document_id
      GROUP BY d.id, d.title, d.file_name, d.file_type, d.file_size, 
               d.source_type, d.metadata, d.created_at, d.updated_at
      ORDER BY d.created_at DESC
    `;
    
    // Get documents with file_name
    const filesOnly = await sql`
      SELECT 
        d.id,
        d.file_name,
        d.file_type,
        d.file_size,
        d.source_type,
        d.created_at,
        COUNT(dc.id) as chunk_count
      FROM documents d
      LEFT JOIN document_chunks dc ON d.id = dc.document_id
      WHERE d.file_name IS NOT NULL
      GROUP BY d.id, d.file_name, d.file_type, d.file_size, 
               d.source_type, d.created_at
      ORDER BY d.created_at DESC
    `;
    
    // Get orphaned chunks (chunks without documents)
    const orphanedChunks = await sql`
      SELECT COUNT(*) as count
      FROM document_chunks dc
      WHERE NOT EXISTS (
        SELECT 1 FROM documents d WHERE d.id = dc.document_id
      )
    `;
    
    // Get all source types
    const sourceTypes = await sql`
      SELECT DISTINCT source_type, COUNT(*) as count
      FROM documents
      GROUP BY source_type
    `;
    
    return NextResponse.json({
      summary: {
        totalDocuments: documents.length,
        filesWithNames: filesOnly.length,
        orphanedChunks: parseInt(orphanedChunks[0].count),
        sourceTypes: sourceTypes
      },
      allDocuments: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        file_name: doc.file_name,
        file_type: doc.file_type,
        source_type: doc.source_type,
        chunk_count: parseInt(doc.chunk_count),
        created_at: doc.created_at
      })),
      filesOnly: filesOnly.map(file => ({
        id: file.id,
        file_name: file.file_name,
        file_type: file.file_type,
        file_size: file.file_size,
        source_type: file.source_type,
        chunk_count: parseInt(file.chunk_count),
        created_at: file.created_at
      }))
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch debug information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}