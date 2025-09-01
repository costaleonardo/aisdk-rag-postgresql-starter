import { neon } from '@neondatabase/serverless';

// Initialize database connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create SQL query function
export const sql = neon(connectionString);

// Type definitions for database entities
export interface Document {
  id: number;
  url?: string | null;
  title?: string | null;
  content: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentChunk {
  id: number;
  document_id: number;
  content: string;
  embedding?: number[];
  chunk_index: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as test`;
    return result.length > 0;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Check if pgvector extension is installed
export async function checkVectorExtension(): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as vector_enabled
    `;
    return result[0]?.vector_enabled || false;
  } catch (error) {
    console.error('Failed to check vector extension:', error);
    return false;
  }
}