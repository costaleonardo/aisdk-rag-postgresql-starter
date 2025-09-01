'use client';

import { useState } from 'react';
import { MessageSquare, Database, Brain } from 'lucide-react';
import ChatInterface from './components/chat-interface';
import IngestForm from './components/ingest-form';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'ingest'>('chat');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                AI SDK RAG Starter
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Powered by Vercel AI SDK + PostgreSQL
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Ingestion */}
          <div className="lg:col-span-1">
            <IngestForm />
            
            {/* Info Card */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">How it works</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Ingest content via URL or text</li>
                <li>Content is chunked and embedded</li>
                <li>Vectors are stored in PostgreSQL</li>
                <li>Chat with your knowledge base</li>
              </ol>
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center space-x-2 px-6 py-4 border-b">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Chat with Knowledge Base</h2>
              </div>
              
              {/* Chat Interface */}
              <div className="flex-1 overflow-hidden">
                <ChatInterface />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Database className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-2">Vector Storage</h3>
            <p className="text-sm text-gray-600">
              PostgreSQL with pgvector for efficient similarity search
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Brain className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-600">
              OpenAI embeddings and GPT-4 for intelligent responses
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <MessageSquare className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-2">Tool Calling</h3>
            <p className="text-sm text-gray-600">
              Advanced AI agent with multiple tools for searching and analysis
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}