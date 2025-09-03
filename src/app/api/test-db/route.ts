import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { testVectorStore } from '@/lib/vector-store';

export async function GET() {
  console.log('=== Testing Database Connection ===');
  
  try {
    // Test basic database connection
    console.log('Testing basic connection...');
    const result = await sql`SELECT 1 as test, NOW() as timestamp`;
    console.log('Basic connection result:', result);
    
    // Check if tables exist
    console.log('Checking tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('documents', 'document_chunks')
    `;
    console.log('Tables found:', tables);
    
    // Check vector extension
    console.log('Checking vector extension...');
    const vectorCheck = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as vector_enabled
    `;
    console.log('Vector extension:', vectorCheck[0].vector_enabled ? 'Enabled' : 'Not installed');
    
    // Count documents
    console.log('Counting documents...');
    const docCount = await sql`SELECT COUNT(*) as count FROM documents`;
    console.log('Document count:', docCount[0].count);
    
    // Count chunks
    console.log('Counting chunks...');
    const chunkCount = await sql`SELECT COUNT(*) as count FROM document_chunks`;
    console.log('Chunk count:', chunkCount[0].count);
    
    // Get recent documents
    console.log('Getting recent documents...');
    const recentDocs = await sql`
      SELECT id, title, source_type, created_at 
      FROM documents 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    console.log('Recent documents:', recentDocs);
    
    // Test vector store
    console.log('\nTesting vector store functionality...');
    await testVectorStore();
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        timestamp: result[0].timestamp,
        tables: tables.map(t => t.table_name),
        vectorEnabled: vectorCheck[0].vector_enabled,
        documentCount: parseInt(docCount[0].count),
        chunkCount: parseInt(chunkCount[0].count),
        recentDocuments: recentDocs
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}