'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Hash } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ToolCall {
  id: string;
  name: string;
  args: any;
  result?: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  toolCalls?: ToolCall[];
}

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageContent: string) => {
    setIsLoading(true);
    setError(null);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      createdAt: new Date()
    };
    
    // Add user message immediately
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          createdAt: new Date(),
          toolCalls: []
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Update the AI message content with accumulated buffer
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, content: buffer }
                : msg
            )
          );
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#003D5B' }}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">Error: {error}</p>
            </div>
          )}
          
          {!messages || messages.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center p-8" style={{ backgroundColor: '#003D5B' }}>
                <svg className="mx-auto h-16 w-16 text-white/70 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h2 className="font-montserrat font-semibold text-[48px] text-white mb-2">RAG Assistant</h2>
                <p className="font-montserrat text-body font-regular text-white/80">
                  Welcome! I can help you search through your knowledge base and find information from your stored documents. 
                  Ask me questions and I'll search through your content to provide detailed answers.
                </p>
                <div className="mt-4 space-y-2 font-montserrat text-caption font-regular text-white/60">
                  <p>&quot;What documents do you have available?&quot;</p>
                  <p>&quot;Search for information about...&quot;</p>
                  <p>&quot;Find documents related to a specific topic&quot;</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="group">
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-4xl w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`px-6 py-4 rounded-2xl shadow-lg ${
                          message.role === 'user'
                            ? 'bg-white text-gray-900 ml-12'
                            : 'bg-white text-gray-900 mr-12 border border-gray-200'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center mb-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#003D5B' }}>
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-caption font-medium text-gray-800">RAG Assistant</span>
                          </div>
                        )}
                        
                        {/* Display tool calls */}
                        {message.toolCalls && message.toolCalls.length > 0 && (
                          <div className="mb-4 space-y-3">
                            {message.toolCalls.map((toolCall) => (
                              <div key={toolCall.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                <div className="flex items-center mb-2">
                                  <Hash className="w-4 h-4 mr-2 text-blue-600" />
                                  <span className="text-caption font-medium text-blue-800">
                                    Tool: {toolCall.name}
                                  </span>
                                  {toolCall.result && (
                                    <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                                  )}
                                </div>
                                
                                <div className="text-caption font-regular text-blue-700 mb-2">
                                  <pre className="whitespace-pre-wrap font-mono text-xs">
                                    {JSON.stringify(toolCall.args, null, 2)}
                                  </pre>
                                </div>
                                
                                {toolCall.result && (
                                  <div className="text-caption font-regular text-green-700">
                                    ✓ Completed successfully
                                    {toolCall.result.count && (
                                      <span className="ml-2">
                                        ({toolCall.result.count} results)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="prose prose-sm max-w-none text-gray-900">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">{children}</h3>,
                              p: ({ children }) => <p className="text-body font-regular text-gray-900 mb-3 leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-900">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-900">{children}</ol>,
                              li: ({ children }) => <li className="text-body font-regular text-gray-900">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                              em: ({ children }) => <em className="italic text-gray-900">{children}</em>,
                              code: ({ children }) => <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-3">{children}</blockquote>,
                              a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isLoading && (
            <div className="mt-6">
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 mr-12 border border-gray-200 px-6 py-4 rounded-2xl shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#003D5B' }}>
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-caption font-regular text-gray-700">Searching...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/20 p-4" style={{ backgroundColor: '#003D5B' }}>
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                handleSendMessage(input);
                setInput('');
              }
            }} 
            className="flex space-x-4"
          >
            <div className="flex-1 relative">
              <input
                value={input}
                placeholder="Ask about your documents, search for information, or explore the knowledge base..."
                onChange={(e) => setInput(e.target.value)}
                className="w-full px-4 py-3 pr-12 text-body font-regular text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-lg placeholder:text-gray-500"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input?.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}