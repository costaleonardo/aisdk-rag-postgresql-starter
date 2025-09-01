'use client';

import ChatInterface from '@/components/chat-interface';

export default function Home() {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      {/* <div className="hidden md:flex items-center justify-center p-4 border-b border-gray-200 bg-white">
        <h1 className="text-heading-3 font-semibold text-gray-800">RAG Assistant - Knowledge Base</h1>
      </div> */}
      
      {/* Chat Interface */}
      <div className="flex-1 min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
}