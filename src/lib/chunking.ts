export interface ChunkOptions {
  maxLength?: number;      // Maximum length of each chunk in characters
  overlap?: number;         // Number of characters to overlap between chunks
  minChunkLength?: number;  // Minimum length for a valid chunk
}

/**
 * Splits text content into overlapping chunks for embedding.
 * Uses sentence boundaries when possible to maintain context.
 */
export function chunkContent(
  text: string, 
  options: ChunkOptions = {}
): string[] {
  const {
    maxLength = 1000,      // Default chunk size
    overlap = 100,         // Default overlap between chunks
    minChunkLength = 100   // Minimum viable chunk size
  } = options;
  
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Split by sentences, keeping sentence endings
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => sentence.trim().length > 0);
  
  if (sentences.length === 0) {
    return text.length > maxLength ? [text.substring(0, maxLength)] : [text];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  let currentLength = 0;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    const sentenceLength = sentence.length;
    
    // If adding this sentence would exceed maxLength
    if (currentLength + sentenceLength > maxLength && currentChunk.length > 0) {
      // Save current chunk if it meets minimum length
      if (currentChunk.trim().length >= minChunkLength) {
        chunks.push(currentChunk.trim());
      }
      
      // Start new chunk with overlap if available
      if (overlap > 0 && chunks.length > 0) {
        const overlapText = getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + (overlapText ? ' ' : '') + sentence;
        currentLength = currentChunk.length;
      } else {
        currentChunk = sentence;
        currentLength = sentenceLength;
      }
    } else {
      // Add sentence to current chunk
      if (currentChunk) {
        currentChunk += ' ' + sentence;
        currentLength += 1 + sentenceLength;
      } else {
        currentChunk = sentence;
        currentLength = sentenceLength;
      }
    }
  }
  
  // Add final chunk if it meets minimum length
  if (currentChunk.trim().length >= minChunkLength) {
    chunks.push(currentChunk.trim());
  }
  
  // Handle edge case where no chunks meet minimum length
  if (chunks.length === 0 && text.trim().length > 0) {
    return [text.trim().substring(0, maxLength)];
  }
  
  return chunks;
}

/**
 * Extracts overlap text from the end of a chunk
 */
function getOverlapText(text: string, overlapLength: number): string {
  if (!text || overlapLength <= 0) {
    return '';
  }
  
  // Try to get overlap at sentence boundary
  const sentences = text.split(/(?<=[.!?])\s+/);
  let overlap = '';
  let currentLength = 0;
  
  // Work backwards to build overlap
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentence = sentences[i];
    if (currentLength + sentence.length <= overlapLength) {
      overlap = sentence + (overlap ? ' ' + overlap : '');
      currentLength += sentence.length + (overlap !== sentence ? 1 : 0);
    } else {
      break;
    }
  }
  
  return overlap;
}

/**
 * Estimates token count for text (rough approximation)
 * OpenAI models typically use ~4 characters per token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Chunks content by estimated token count instead of character count
 */
export function chunkContentByTokens(
  text: string, 
  maxTokens: number = 250,
  overlapTokens: number = 25
): string[] {
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;
  
  return chunkContent(text, {
    maxLength: maxChars,
    overlap: overlapChars,
    minChunkLength: 50
  });
}