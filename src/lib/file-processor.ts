import { Buffer } from 'buffer';

interface ProcessedFile {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    pageCount?: number;
    wordCount?: number;
  };
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdf = await import('pdf-parse');
    const data = await pdf.default(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

export async function extractTextFromCSV(buffer: Buffer): Promise<string> {
  try {
    const { parse } = await import('csv-parse/sync');
    const records = parse(buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });
    
    // Convert CSV records to readable text format
    const text = records.map((record: any) => {
      return Object.entries(record)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }).join('\n');
    
    return text;
  } catch (error) {
    console.error('Error extracting text from CSV:', error);
    throw new Error('Failed to extract text from CSV');
  }
}

export function extractTextFromPlain(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

export async function processFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ProcessedFile> {
  const fileSize = buffer.length;
  let text = '';
  let fileType = '';
  
  // Determine file type from extension if MIME type is not specific enough
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'pdf':
      fileType = 'pdf';
      text = await extractTextFromPDF(buffer);
      break;
      
    case 'docx':
      fileType = 'docx';
      text = await extractTextFromDOCX(buffer);
      break;
      
    case 'csv':
      fileType = 'csv';
      text = await extractTextFromCSV(buffer);
      break;
      
    case 'txt':
      fileType = 'txt';
      text = extractTextFromPlain(buffer);
      break;
      
    case 'md':
      fileType = 'markdown';
      text = extractTextFromPlain(buffer);
      break;
      
    default:
      // Try to handle based on MIME type
      if (mimeType.includes('pdf')) {
        fileType = 'pdf';
        text = await extractTextFromPDF(buffer);
      } else if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
        fileType = 'docx';
        text = await extractTextFromDOCX(buffer);
      } else if (mimeType.includes('csv')) {
        fileType = 'csv';
        text = await extractTextFromCSV(buffer);
      } else if (mimeType.includes('text')) {
        fileType = 'text';
        text = extractTextFromPlain(buffer);
      } else {
        throw new Error(`Unsupported file type: ${extension || mimeType}`);
      }
  }
  
  // Calculate word count
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  
  return {
    text,
    metadata: {
      fileName,
      fileType,
      fileSize,
      wordCount,
    },
  };
}

export const SUPPORTED_FILE_TYPES = ['.pdf', '.docx', '.txt', '.md', '.csv'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_UPLOAD = 5;

export function validateFile(fileName: string, fileSize: number): void {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (!extension || !SUPPORTED_FILE_TYPES.includes(`.${extension}`)) {
    throw new Error(`Unsupported file type. Supported types: ${SUPPORTED_FILE_TYPES.join(', ')}`);
  }
  
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
}