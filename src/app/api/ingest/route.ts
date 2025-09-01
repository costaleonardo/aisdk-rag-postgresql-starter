import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrl, validateContent } from '@/lib/scraper';
import { chunkContent } from '@/lib/chunking';
import { storeDocument } from '@/lib/vector-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, content, title, chunkSize = 1000, chunkOverlap = 100 } = body;

    // Validate input
    if (!url && !content) {
      return NextResponse.json(
        { error: 'Either URL or content is required' },
        { status: 400 }
      );
    }

    let documentContent;

    if (url) {
      // Scrape content from URL
      console.log(`Scraping URL: ${url}`);
      documentContent = await scrapeUrl(url);
      
      // Validate scraped content
      if (!validateContent(documentContent)) {
        return NextResponse.json(
          { error: 'Scraped content is too short or invalid' },
          { status: 400 }
        );
      }
    } else {
      // Use provided content
      if (!title) {
        return NextResponse.json(
          { error: 'Title is required when providing raw content' },
          { status: 400 }
        );
      }
      
      documentContent = {
        url: undefined,
        title,
        content,
        metadata: {}
      };
    }

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
    const storedDocument = await storeDocument(documentContent, chunks);

    return NextResponse.json({
      success: true,
      document: {
        id: storedDocument.id,
        url: storedDocument.url,
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
    message: 'Ingestion endpoint is ready. Send a POST request with URL or content to ingest.',
    example: {
      url: 'https://example.com/article',
      // OR
      content: 'Your text content here...',
      title: 'Document Title (required if using content)',
      chunkSize: 1000, // optional
      chunkOverlap: 100 // optional
    }
  });
}