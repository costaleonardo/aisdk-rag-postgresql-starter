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

      console.log(`Processing file: ${file.name} (${file.size} bytes, type: ${file.type})`);

      try {
        // Validate file
        validateFile(file.name, file.size);

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Process file to extract text
        console.log(`Extracting text from ${file.name}...`);
        const processed = await processFile(
          buffer,
          file.name,
          file.type || 'application/octet-stream'
        );
        console.log(`Extracted ${processed.text.length} characters from ${file.name}`);

        // Chunk the extracted text
        const chunks = chunkText(processed.text, {
          maxChunkSize: 1000,
          overlap: 100,
        });
        console.log(`Created ${chunks.length} chunks for ${file.name}`);

        // Store document with metadata
        console.log(`Storing document in database for ${file.name}...`);
        console.log('Document storage parameters:', {
          title: file.name,
          contentLength: processed.text.length,
          chunksCount: chunks.length,
          file_name: processed.metadata.fileName,
          file_type: processed.metadata.fileType,
          file_size: processed.metadata.fileSize,
        });
        
        const storedDoc = await storeDocument({
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
        
        console.log(`Successfully stored document ${file.name} with ID: ${storedDoc.id}, chunks created: ${storedDoc.chunksCreated}`);

        results.push({
          fileName: file.name,
          documentId: storedDoc.id,
          chunksCreated: storedDoc.chunksCreated,
          wordCount: processed.metadata.wordCount,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        console.error('Full error details:', error);
        errors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('=== Upload Summary ===');
    console.log(`Successful: ${results.length} files`);
    console.log(`Failed: ${errors.length} files`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
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
    console.error('Full error stack:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}