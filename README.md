# RAG Assistant - AI-Powered Knowledge Base

A professional RAG (Retrieval Augmented Generation) application with a beautiful chat interface, built with Next.js 14, Vercel AI SDK, and PostgreSQL with pgvector. Features a sliding sidebar navigation, streaming chat responses, and intelligent document search capabilities.

## Features

- **🎨 Professional UI** - Beautiful chat interface with sliding sidebar navigation
- **🚀 Quick Setup** - Get your RAG application running in minutes
- **🔍 Vector Search** - PostgreSQL with pgvector for efficient semantic similarity search
- **🤖 AI-Powered Chat** - Streaming responses with GPT-4o and intelligent tool calling
- **📊 Web Scraping** - Automatic content extraction and cleaning from URLs
- **📝 Direct Input** - Add text content directly through chat or dedicated interface
- **⚡ Real-time Streaming** - Smooth chat experience with streaming responses
- **🛠️ Smart Tools** - AI agent with multiple tools for searching and content management
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices
- **📦 TypeScript** - Full type safety across the application

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI SDK**: Vercel AI SDK v5.0.27
- **LLM**: OpenAI GPT-4o
- **Embeddings**: OpenAI text-embedding-ada-002 (1536 dimensions)
- **Database**: PostgreSQL with pgvector extension
- **Styling**: Tailwind CSS v4 with custom design system
- **Typography**: Montserrat font family
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

### 1. Add Content to Knowledge Base

You can add content to your knowledge base in multiple ways:

**Via Chat Interface**:
- Ask the assistant to add content directly: "Add this information about..."
- The AI will use the `addResource` tool to store content with proper chunking

**Via Web Scraper Page** (`/scraper`):
- **URL Scraping**: Enter any website URL for automatic content extraction and cleaning
- **Direct Text Input**: Paste raw text content with optional title
- Professional interface with real-time feedback

**Automatic Processing**:
- Content is intelligently chunked using sentence boundaries
- Each chunk is embedded using OpenAI's text-embedding-ada-002
- Stored in PostgreSQL with vector indexes for fast similarity search

### 2. Chat with Your Knowledge Base

The AI assistant provides intelligent search and retrieval:
- **Semantic Search**: Find relevant information using natural language queries
- **Source Citation**: Get accurate answers with source references
- **Multi-step Reasoning**: Complex queries handled with up to 5 reasoning steps
- **Content Suggestions**: AI suggests adding missing information when needed

### Available AI Tools

The chat interface includes these intelligent tools:

- **`addResource`**: Add new content directly to knowledge base through chat
- **`getInformation`**: Semantic vector search with similarity scoring
- **`getDocument`**: Retrieve specific documents by ID with full content
- **`listDocuments`**: Browse available documents with previews and metadata

## Project Structure

```
aisdk-rag-postgresql-starter/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/          # AI chat endpoint with GPT-4o and tool calling
│   │   │   └── ingest/        # Content ingestion endpoint (URL + text)
│   │   ├── scraper/           # Web scraping and text input interface
│   │   ├── page.tsx           # Main chat interface
│   │   ├── layout.tsx         # Root layout with Montserrat font
│   │   └── globals.css        # Global styles with custom design system
│   ├── components/
│   │   ├── main-layout.tsx    # Root layout with sliding sidebar
│   │   ├── sidebar.tsx        # Professional sidebar navigation
│   │   ├── chat-interface.tsx # Chat UI with streaming and tool visualization
│   │   └── ui/                # Reusable UI components
│   │       ├── button.tsx     # Styled button component
│   │       ├── card.tsx       # Card component with variants
│   │       └── input.tsx      # Form input component
│   └── lib/
│       ├── db.ts              # Neon PostgreSQL connection
│       ├── vector-store.ts    # Vector operations and embedding generation
│       ├── chunking.ts        # Intelligent text chunking with sentence boundaries
│       └── scraper.ts         # Web scraping with Cheerio
├── database/
│   └── schema.sql             # PostgreSQL schema with pgvector and HNSW indexes
├── public/
│   └── logo.svg               # Application logo
├── package.json               # Dependencies including AI SDK v5 and Tailwind v4
├── tailwind.config.js         # Custom design system configuration
└── CLAUDE.md                  # Development guidance for Claude Code
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

## UI Design System

### Color Palette
- **Primary**: #003D5B (Unifying Blue) - Sidebar background and accents
- **Background**: White content areas with blue sidebar theme
- **Typography**: Montserrat font with custom scales (heading-1 to heading-5, body, caption)

### Layout System
- **Sidebar**: Collapsible (64px collapsed, 256px expanded) with smooth animations
- **Responsive**: Mobile-friendly design with proper touch interactions
- **Components**: Consistent UI components with variant support

## Customization

### Modify the System Prompt

Edit the AI assistant behavior in `src/app/api/chat/route.ts`:

```typescript
system: `Your custom system prompt here...`
```

### Add Custom Tools

Extend the AI capabilities with new tools:

```typescript
tools: {
  yourCustomTool: tool({
    description: 'Tool description',
    inputSchema: z.object({
      // Define parameters with Zod validation
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

Modify text processing in `src/lib/chunking.ts`:

```typescript
const {
  maxLength = 1000,      // Chunk size
  overlap = 100,         // Overlap between chunks
  minChunkLength = 100   // Minimum chunk size
} = options;
```

### Customize UI Theme

Update the design system in `tailwind.config.js`:

```javascript
colors: {
  'unifying-blue': '#003D5B',  // Primary brand color
  // Add your custom colors
}
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

**RAG Assistant** - Built with ❤️ using Vercel AI SDK, PostgreSQL, and a professional design system for beautiful RAG experiences.