import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { vectorSearch, getDocumentById, getAllDocuments, fullTextSearch } from '@/lib/vector-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 });
    }

    // Stream the response using Vercel AI SDK
    const result = streamText({
      model: openai('gpt-4o-mini'), // Using mini for cost efficiency
      system: `You are a helpful AI assistant with access to a knowledge base stored in a vector database. 
      
You can search through documents, retrieve specific information, and provide accurate answers based on the stored content.

Available tools:
- searchDocuments: Semantic search through the knowledge base
- getDocument: Retrieve a specific document by ID
- listDocuments: Browse available documents
- fullTextSearch: Search documents using keywords

When answering questions:
1. Search the knowledge base for relevant information
2. Cite your sources when providing information
3. Be clear when information is not available in the knowledge base
4. Provide comprehensive answers based on the retrieved content`,
      messages,
      tools: {
        searchDocuments: tool({
          description: 'Search for relevant documents using semantic similarity',
          parameters: z.object({
            query: z.string().describe('The search query'),
            limit: z.number().optional().default(5).describe('Number of results to return'),
            threshold: z.number().optional().default(0.7).describe('Similarity threshold (0-1)')
          }),
          execute: async ({ query, limit, threshold }) => {
            try {
              const results = await vectorSearch(query, limit, threshold);
              
              if (results.length === 0) {
                return {
                  success: false,
                  message: 'No relevant documents found',
                  results: []
                };
              }
              
              return {
                success: true,
                message: `Found ${results.length} relevant documents`,
                results: results.map(r => ({
                  content: r.content,
                  title: r.document_title,
                  url: r.document_url,
                  similarity: r.similarity,
                  documentId: r.document_id
                }))
              };
            } catch (error) {
              console.error('Search error:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Search failed'
              };
            }
          }
        }),

        getDocument: tool({
          description: 'Get a specific document by its ID',
          parameters: z.object({
            documentId: z.number().describe('The document ID')
          }),
          execute: async ({ documentId }) => {
            try {
              const document = await getDocumentById(documentId);
              
              if (!document) {
                return {
                  success: false,
                  error: 'Document not found'
                };
              }
              
              return {
                success: true,
                document: {
                  id: document.id,
                  title: document.title,
                  content: document.content,
                  url: document.url,
                  metadata: document.metadata,
                  createdAt: document.created_at
                }
              };
            } catch (error) {
              console.error('Get document error:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve document'
              };
            }
          }
        }),

        listDocuments: tool({
          description: 'List available documents in the knowledge base',
          parameters: z.object({
            limit: z.number().optional().default(10).describe('Number of documents to return'),
            offset: z.number().optional().default(0).describe('Offset for pagination')
          }),
          execute: async ({ limit, offset }) => {
            try {
              const documents = await getAllDocuments(limit, offset);
              
              return {
                success: true,
                count: documents.length,
                documents: documents.map(d => ({
                  id: d.id,
                  title: d.title,
                  url: d.url,
                  createdAt: d.created_at,
                  preview: d.content.substring(0, 200) + '...'
                }))
              };
            } catch (error) {
              console.error('List documents error:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list documents'
              };
            }
          }
        }),

        fullTextSearch: tool({
          description: 'Search documents using full-text search (keyword-based)',
          parameters: z.object({
            query: z.string().describe('Keywords to search for'),
            limit: z.number().optional().default(10).describe('Number of results')
          }),
          execute: async ({ query, limit }) => {
            try {
              const documents = await fullTextSearch(query, limit);
              
              if (documents.length === 0) {
                return {
                  success: false,
                  message: 'No documents found matching the keywords',
                  results: []
                };
              }
              
              return {
                success: true,
                message: `Found ${documents.length} documents`,
                results: documents.map(d => ({
                  id: d.id,
                  title: d.title,
                  url: d.url,
                  preview: d.content.substring(0, 300) + '...',
                  createdAt: d.created_at
                }))
              };
            } catch (error) {
              console.error('Full-text search error:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Search failed'
              };
            }
          }
        })
      },
      maxSteps: 5, // Allow multiple tool calls
      onStepFinish: ({ text, toolCalls, toolResults }) => {
        // Optional: Log tool usage for debugging
        if (toolCalls && toolCalls.length > 0) {
          console.log('Tools called:', toolCalls.map(tc => tc.toolName));
        }
      }
    });

    // Return the streaming response
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}