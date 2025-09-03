import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Get all documents with file metadata
    const result = await sql`
      SELECT 
        d.id,
        d.title,
        d.file_name,
        d.file_type,
        d.file_size,
        d.source_type,
        d.metadata,
        d.created_at,
        COUNT(dc.id) as chunk_count
      FROM documents d
      LEFT JOIN document_chunks dc ON d.id = dc.document_id
      WHERE d.file_name IS NOT NULL
      GROUP BY d.id, d.title, d.file_name, d.file_type, d.file_size, d.source_type, d.metadata, d.created_at
      ORDER BY d.created_at DESC
    `;
    
    // Clean up the data to prevent null/undefined issues
    const files = result.map(file => ({
      id: String(file.id),
      file_name: String(file.file_name || 'Unnamed file'),
      file_type: String(file.file_type || 'unknown'),
      file_size: Number(file.file_size || 0),
      source_type: String(file.source_type),
      metadata: file.metadata || {},
      created_at: file.created_at,
      chunk_count: Number(file.chunk_count || 0)
    }));
    
    return NextResponse.json({
      files: files,
      total: files.length
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}