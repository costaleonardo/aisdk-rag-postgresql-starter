import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Disable caching for this endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Get all documents with file metadata using working query
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
      file_name: file.file_name ? String(file.file_name) : 'Unnamed file',
      file_type: file.file_type ? String(file.file_type) : 'Unknown',
      file_size: file.file_size ? Number(file.file_size) : 0,
      source_type: file.source_type ? String(file.source_type) : 'file',
      metadata: file.metadata || {},
      created_at: file.created_at,
      chunk_count: file.chunk_count ? Number(file.chunk_count) : 0
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