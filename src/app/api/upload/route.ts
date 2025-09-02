import { NextRequest, NextResponse } from 'next/server';
import { 
  processFile, 
  validateFile, 
  MAX_FILES_PER_UPLOAD 
} from '@/lib/file-processor';
import { storeDocument } from '@/lib/vector-store';
import { chunkText } from '@/lib/chunking';
import { Buffer } from 'buffer';

export async function POST(req: NextRequest) {
  try {
    // Read the body as a buffer for formidable
    const formData = await req.formData();
    const uploadedFiles = formData.getAll('files');
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (uploadedFiles.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload` },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const file of uploadedFiles) {
      if (!(file instanceof File)) {
        errors.push({ fileName: 'unknown', error: 'Invalid file format' });
        continue;
      }

      try {
        // Validate file
        validateFile(file.name, file.size);

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Process file to extract text
        const processed = await processFile(
          buffer,
          file.name,
          file.type || 'application/octet-stream'
        );

        // Chunk the extracted text
        const chunks = chunkText(processed.text, {
          maxChunkSize: 1000,
          overlap: 100,
        });

        // Store document with metadata
        const documentId = await storeDocument({
          title: file.name,
          content: processed.text,
          chunks,
          metadata: {
            ...processed.metadata,
            uploadedAt: new Date().toISOString(),
          },
          file_name: processed.metadata.fileName,
          file_type: processed.metadata.fileType,
          file_size: processed.metadata.fileSize,
          source_type: 'file',
        });

        results.push({
          fileName: file.name,
          documentId,
          chunksCreated: chunks.length,
          wordCount: processed.metadata.wordCount,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        errors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully processed ${results.length} file(s)${
        errors.length > 0 ? `, ${errors.length} file(s) failed` : ''
      }`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}