import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { vectorSearch, getDocumentById, getAllDocuments, storeDocument } from '@/lib/vector-store';
import { chunkContent } from '@/lib/chunking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 });
    }

    // Convert messages to the format expected by the AI SDK
    const modelMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content || ''
    }));

    const result = streamText({
      model: openai('gpt-4o'),
      system: `You are a helpful AI assistant with access to a knowledge base stored in a vector database. You can search through documents, add new content to the knowledge base, and provide accurate answers based on the stored content.

Available tools:
- addResource: Add new content to the knowledge base (useful when users want to store new information)
- getInformation: Search through the knowledge base to find relevant information
- listDocuments: Browse available documents in the database
- getDocument: Retrieve a specific document by ID

When answering questions:
1. First check if the requested information is available in the knowledge base
2. If no relevant information is found, let the user know and suggest they add the information
3. Cite your sources when providing information from the knowledge base
4. Provide comprehensive answers based on the retrieved content
5. Be helpful and suggest adding relevant content when appropriate

Guidelines:
- Use search tools to find relevant content based on queries
- Explain findings in clear, actionable terms
- Always be transparent about what information is available or missing
- Suggest adding new content when users ask about topics not in the knowledge base`,
      messages: modelMessages,
      stopWhen: stepCountIs(5),
      tools: {
        addResource: tool({
          description: 'Add new content to the knowledge base for future retrieval',
          inputSchema: z.object({
            content: z.string().describe('The content to add to the knowledge base'),
            title: z.string().optional().describe('Optional title for the content'),
            url: z.string().optional().describe('Optional URL source for the content')
          }),
          execute: async ({ content, title, url }) => {
            try {
              // Chunk the content
              const chunks = chunkContent(content);
              
              if (chunks.length === 0) {
                return {
                  success: false,
                  error: 'Content too short or empty after processing'
                };
              }

              // Store the document with chunks
              const result = await storeDocument({
                title: title || 'User-provided content',
                content: content,
                url: url || undefined,
                chunks,
                metadata: {
                  source: 'chat_interface',
                  added_at: new Date().toISOString()
                }
              });

              return {
                success: true,
                documentId: result.id,
                chunksCreated: result.chunksCreated,
                message: `Successfully added content to knowledge base. Document ID: ${result.id}, Created ${result.chunksCreated} searchable chunks.`
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to add content'
              };
            }
          }
        }),

        getInformation: tool({
          description: 'Search the knowledge base for relevant information',
          inputSchema: z.object({
            query: z.string().describe('The search query to find relevant information'),
            limit: z.number().optional().default(5).describe('Number of results to return')
          }),
          execute: async ({ query, limit }) => {
            try {
              const results = await vectorSearch(query, limit, 0.7);
              
              if (results.length === 0) {
                return {
                  success: true,
                  results: [],
                  message: 'No relevant information found in the knowledge base for this query.'
                };
              }

              const enrichedResults = await Promise.all(
                results.map(async (result) => {
                  const doc = await getDocumentById(result.document_id);
                  return {
                    content: result.content,
                    similarity: result.similarity,
                    documentId: result.document_id,
                    title: doc?.title,
                    url: doc?.url,
                    chunkId: result.chunk_id
                  };
                })
              );

              return {
                success: true,
                results: enrichedResults,
                count: enrichedResults.length,
                message: `Found ${enrichedResults.length} relevant pieces of information in the knowledge base.`
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Search failed'
              };
            }
          }
        }),

        listDocuments: tool({
          description: 'List available documents in the knowledge base',
          inputSchema: z.object({
            limit: z.number().optional().default(10).describe('Number of documents to return')
          }),
          execute: async ({ limit }) => {
            try {
              const documents = await getAllDocuments(limit, 0);
              return {
                success: true,
                documents: documents.map(doc => ({
                  id: doc.id,
                  title: doc.title,
                  url: doc.url,
                  preview: doc.content ? doc.content.substring(0, 200) + '...' : 'No preview available',
                  createdAt: doc.created_at
                })),
                count: documents.length,
                message: `Found ${documents.length} documents in the knowledge base.`
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list documents'
              };
            }
          }
        }),

        getDocument: tool({
          description: 'Retrieve a specific document by its ID',
          inputSchema: z.object({
            documentId: z.number().describe('The ID of the document to retrieve')
          }),
          execute: async ({ documentId }) => {
            try {
              const document = await getDocumentById(documentId);
              
              if (!document) {
                return {
                  success: false,
                  error: `Document with ID ${documentId} not found`
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
                },
                message: `Retrieved document: ${document.title || `Document ${document.id}`}`
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve document'
              };
            }
          }
        })
      }
    });

    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}