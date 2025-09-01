# AI SDK + RAG + PostgreSQL Starter Template

A production-ready starter template for building Retrieval Augmented Generation (RAG) applications using Vercel AI SDK, PostgreSQL with pgvector, and Next.js.

## Features

- **🚀 Quick Setup** - Get your RAG application running in minutes
- **🔍 Vector Search** - PostgreSQL with pgvector for efficient similarity search
- **🤖 AI-Powered Chat** - Streaming responses with GPT-4 and tool calling
- **📊 Web Scraping** - Automatic content extraction from URLs
- **📝 Text Ingestion** - Direct text input for knowledge base creation
- **⚡ Real-time Streaming** - Smooth chat experience with streaming responses
- **🛠️ Tool Calling** - AI agent with multiple tools for searching and analysis
- **📦 TypeScript** - Full type safety across the application

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI SDK**: Vercel AI SDK
- **LLM**: OpenAI GPT-4
- **Embeddings**: OpenAI text-embedding-ada-002
- **Database**: PostgreSQL with pgvector extension
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Quick Start

### Prerequisites

1. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **PostgreSQL Database** with pgvector extension:
   - **Neon** (Recommended): [neon.tech](https://neon.tech) - Serverless PostgreSQL with pgvector
   - **Supabase**: [supabase.com](https://supabase.com) - Includes pgvector support
   - **Local**: Install PostgreSQL and pgvector extension

### Installation

1. **Clone the template**:
```bash
git clone https://github.com/yourusername/aisdk-rag-postgresql-starter.git
cd aisdk-rag-postgresql-starter
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
```

4. **Initialize the database**:

Run the schema SQL in your PostgreSQL database:
```bash
psql $DATABASE_URL < database/schema.sql
```

Or use your database provider's SQL editor to run the contents of `database/schema.sql`.

5. **Start the development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Usage

### 1. Ingest Content

You can add content to your knowledge base in two ways:

**Via URL**:
- Enter any website URL
- The system will scrape, chunk, and embed the content
- Automatic text extraction and cleaning

**Via Text**:
- Paste raw text content
- Provide a title for the document
- Direct ingestion without web scraping

### 2. Chat with Your Knowledge Base

The AI assistant can:
- Search through your documents semantically
- Retrieve specific information
- Answer questions based on stored content
- Cite sources from your knowledge base

### Available AI Tools

The chat interface includes these built-in tools:

- **`searchDocuments`**: Semantic similarity search
- **`getDocument`**: Retrieve specific documents by ID
- **`listDocuments`**: Browse all stored documents
- **`fullTextSearch`**: Keyword-based search

## Project Structure

```
aisdk-rag-postgresql-starter/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/          # AI chat endpoint with tool calling
│   │   │   └── ingest/        # Content ingestion endpoint
│   │   ├── components/
│   │   │   ├── chat-interface.tsx   # Chat UI component
│   │   │   └── ingest-form.tsx      # Ingestion form component
│   │   ├── page.tsx           # Main application page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   └── lib/
│       ├── chunking.ts        # Text chunking utilities
│       ├── db.ts              # Database connection
│       ├── scraper.ts         # Web scraping utilities
│       └── vector-store.ts    # Vector operations and storage
├── database/
│   └── schema.sql            # PostgreSQL schema with pgvector
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── .env.example
```

## API Endpoints

### POST `/api/ingest`
Ingest content from URL or raw text.

**Request body**:
```json
{
  "url": "https://example.com/article",
  // OR
  "content": "Your text content...",
  "title": "Document Title",
  "chunkSize": 1000,      // optional
  "chunkOverlap": 100     // optional
}
```

### POST `/api/chat`
Chat with the AI assistant.

**Request body**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Your question here"
    }
  ]
}
```

## Database Schema

The template uses a simple but powerful schema:

- **`documents`**: Stores original content and metadata
- **`document_chunks`**: Stores text chunks with vector embeddings
- **Indexes**: HNSW index for fast similarity search

## Customization

### Modify the System Prompt

Edit the system prompt in `src/app/api/chat/route.ts`:

```typescript
system: `Your custom system prompt here...`
```

### Add Custom Tools

Add new tools to the chat endpoint:

```typescript
tools: {
  yourCustomTool: tool({
    description: 'Tool description',
    parameters: z.object({
      // Define parameters
    }),
    execute: async (params) => {
      // Tool implementation
    }
  })
}
```

### Change Embedding Model

Update the embedding model in `src/lib/vector-store.ts`:

```typescript
model: openai.embedding('text-embedding-3-small'), // or another model
```

### Adjust Chunking Strategy

Modify chunking parameters in `src/lib/chunking.ts`:

```typescript
const {
  maxLength = 1000,      // Chunk size
  overlap = 100,         // Overlap between chunks
  minChunkLength = 100   // Minimum chunk size
} = options;
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings and chat | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Database Providers

### Neon (Recommended)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Enable pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy connection string to `.env`

### Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Enable pgvector in Database → Extensions
4. Copy connection string to `.env`

### Local PostgreSQL
1. Install PostgreSQL
2. Install pgvector:
   ```bash
   git clone https://github.com/pgvector/pgvector.git
   cd pgvector
   make
   make install
   ```
3. Create database and enable extension:
   ```sql
   CREATE DATABASE rag_db;
   CREATE EXTENSION vector;
   ```

## Production Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Common Issues & Solutions

### "DATABASE_URL environment variable is not set"
- Make sure you've created `.env` file
- Check that `.env` is in the root directory
- Restart the development server

### "pgvector extension not found"
- Enable the extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- Check your database provider supports pgvector

### "OpenAI API key is invalid"
- Verify your API key is correct
- Check you have credits in your OpenAI account
- Ensure the key has proper permissions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this template for your projects.

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation above

## Acknowledgments

- [Vercel AI SDK](https://sdk.vercel.ai/) for the excellent AI framework
- [OpenAI](https://openai.com/) for GPT and embedding models
- [pgvector](https://github.com/pgvector/pgvector) for vector similarity search
- [Next.js](https://nextjs.org/) for the React framework

---

Built with ❤️ using Vercel AI SDK and PostgreSQL :)