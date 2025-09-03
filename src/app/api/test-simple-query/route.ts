import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('Testing simple query...');
    
    // First check what documents exist
    const allDocs = await sql`SELECT id, file_name, source_type FROM documents ORDER BY id`;
    console.log('All documents:', allDocs);
    
    // Check file documents only
    const fileDocs = await sql`SELECT id, file_name, source_type FROM documents WHERE source_type = 'file'`;
    console.log('File documents:', fileDocs);
    
    // Check file documents with non-null file_name
    const validFiles = await sql`SELECT id, file_name, source_type FROM documents WHERE source_type = 'file' AND file_name IS NOT NULL`;
    console.log('Valid file documents:', validFiles);
    
    return NextResponse.json({ 
      success: true,
      allDocs: allDocs.length,
      fileDocs: fileDocs.length, 
      validFiles: validFiles.length,
      examples: {
        allDocs: allDocs.slice(0, 3),
        fileDocs: fileDocs.slice(0, 3),
        validFiles: validFiles.slice(0, 3)
      }
    });
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}