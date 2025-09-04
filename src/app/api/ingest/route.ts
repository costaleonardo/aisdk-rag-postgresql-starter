import { NextRequest, NextResponse } from 'next/server';
import { chunkContent } from '@/lib/chunking';
import { storeDocument } from '@/lib/vector-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, title, chunkSize = 1000, chunkOverlap = 100 } = body;

    // Validate input - only accept content and title
    if (!content || !title) {
      return NextResponse.json(
        { error: 'Both content and title are required' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length < 50) {
      return NextResponse.json(
        { error: 'Content must be at least 50 characters long' },
        { status: 400 }
      );
    }

    const documentContent = {
      url: undefined,
      title,
      content,
      metadata: {}
    };

    // Chunk the content
    console.log(`Chunking content with size ${chunkSize} and overlap ${chunkOverlap}`);
    const chunks = chunkContent(documentContent.content, {
      maxLength: chunkSize,
      overlap: chunkOverlap,
      minChunkLength: 50
    });

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No valid chunks could be created from the content' },
        { status: 400 }
      );
    }

    console.log(`Created ${chunks.length} chunks`);

    // Store document and generate embeddings
    console.log('Storing document and generating embeddings...');
    const storedDocument = await storeDocument({
      ...documentContent,
      chunks
    });

    return NextResponse.json({
      success: true,
      document: {
        id: storedDocument.id,
        title: storedDocument.title,
        chunksCreated: storedDocument.chunksCreated,
        totalChunks: chunks.length
      }
    });

  } catch (error) {
    console.error('Ingestion error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: `Failed to ingest content: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check ingestion status
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Ingestion endpoint is ready. Send a POST request with content and title to ingest.',
    example: {
      content: 'Your text content here...',
      title: 'Document Title (required)',
      chunkSize: 1000, // optional
      chunkOverlap: 100 // optional
    }
  });
}