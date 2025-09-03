import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('Testing files query...');
    
    const result = await sql`
      SELECT 
        d.id,
        d.file_name,
        d.file_type,
        d.file_size,
        d.source_type,
        d.metadata,
        d.created_at,
        COUNT(dc.id) as chunk_count
      FROM documents d
      LEFT JOIN document_chunks dc ON d.id = dc.document_id
      WHERE d.source_type = 'file' AND d.file_name IS NOT NULL
      GROUP BY d.id, d.file_name, d.file_type, d.file_size, d.source_type, d.metadata, d.created_at
      ORDER BY d.created_at DESC
    `;
    
    console.log('Query result:', result.length, 'rows');
    console.log('First row:', result[0]);
    
    return NextResponse.json({ 
      success: true,
      count: result.length,
      results: result
    });
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}