import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { storeDocument } from '@/lib/vector-store';
import { chunkText } from '@/lib/chunking';

export async function GET() {
  console.log('=== Testing File Upload Pipeline ===');
  
  try {
    // Test content
    const testContent = `This is a test document for verifying the file upload pipeline.
    It contains sample text that should be chunked and stored in the database.
    The system should create embeddings for each chunk and store them properly.`;
    
    const testFileName = `test-file-${Date.now()}.txt`;
    
    console.log('1. Creating test chunks...');
    const chunks = chunkText(testContent, {
      maxChunkSize: 100,
      overlap: 20,
    });
    console.log(`Created ${chunks.length} chunks`);
    
    console.log('2. Storing document in database...');
    const storedDoc = await storeDocument({
      title: testFileName,
      content: testContent,
      chunks,
      metadata: {
        test: true,
        createdAt: new Date().toISOString(),
      },
      file_name: testFileName,
      file_type: 'txt',
      file_size: testContent.length,
      source_type: 'file',
    });
    
    console.log('3. Document stored with ID:', storedDoc.id);
    
    // Verify storage
    console.log('4. Verifying document in database...');
    const verifyDoc = await sql`
      SELECT id, title, file_name, file_type, file_size, source_type 
      FROM documents 
      WHERE id = ${storedDoc.id}
    `;
    
    const verifyChunks = await sql`
      SELECT COUNT(*) as count 
      FROM document_chunks 
      WHERE document_id = ${storedDoc.id}
    `;
    
    console.log('5. Verification complete');
    console.log('Document found:', verifyDoc.length > 0);
    console.log('Chunks stored:', verifyChunks[0]?.count);
    
    // Clean up test document
    console.log('6. Cleaning up test document...');
    await sql`DELETE FROM documents WHERE id = ${storedDoc.id}`;
    
    return NextResponse.json({
      success: true,
      test: 'File upload pipeline test passed',
      results: {
        documentStored: verifyDoc.length > 0,
        documentId: storedDoc.id,
        chunksCreated: storedDoc.chunksCreated,
        chunksVerified: parseInt(verifyChunks[0]?.count || '0'),
        documentDetails: verifyDoc[0] || null,
      }
    });
    
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

export async function POST() {
  console.log('=== Testing Real File Upload ===');
  
  try {
    // First check database connectivity
    const dbCheck = await sql`SELECT 1 as connected`;
    console.log('Database connected:', dbCheck[0]?.connected === 1);
    
    // Check documents table
    const docCount = await sql`SELECT COUNT(*) as count FROM documents WHERE source_type = 'file'`;
    console.log('Current file documents:', docCount[0]?.count);
    
    // Get recent file uploads
    const recentFiles = await sql`
      SELECT id, file_name, file_type, file_size, created_at 
      FROM documents 
      WHERE source_type = 'file' 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    console.log('Recent file uploads:', recentFiles);
    
    return NextResponse.json({
      success: true,
      databaseConnected: true,
      fileDocumentCount: parseInt(docCount[0]?.count || '0'),
      recentFiles: recentFiles,
    });
    
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}