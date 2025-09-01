'use client';

import { useState } from 'react';
import { Globe, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ScraperPage() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'url' | 'text'>('url');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: mode === 'url' ? url : undefined,
          content: mode === 'text' ? content : undefined,
          title: mode === 'text' ? title : undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to ingest content');
      }

      setSuccess(true);
      setUrl('');
      setContent('');
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#003D5B' }}>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-8 text-center">
            <Globe className="mx-auto h-16 w-16 text-white/70 mb-6" />
            <h1 className="font-montserrat font-semibold text-[48px] text-white mb-2">Web Scraper</h1>
            <p className="font-montserrat text-body font-regular text-white/80">
              Add content to your knowledge base by scraping web pages or entering text directly.
            </p>
          </div>

          <Card variant="elevated" className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Add Content to Knowledge Base</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mode Toggle */}
              <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                <button
                  onClick={() => setMode('url')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    mode === 'url'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Scrape URL
                </button>
                <button
                  onClick={() => setMode('text')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    mode === 'text'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Add Text
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'url' ? (
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                      Website URL
                    </label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Title (optional)
                      </label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="Document title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                        Content
                      </label>
                      <textarea
                        id="content"
                        rows={8}
                        className="flex w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter your content here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      Content successfully added to knowledge base!
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading || (mode === 'url' && !url) || (mode === 'text' && !content)}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Knowledge Base
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">How it works</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Content is automatically chunked into searchable segments</li>
                  <li>Each chunk is converted to embeddings using OpenAI</li>
                  <li>Embeddings are stored in PostgreSQL with pgvector</li>
                  <li>Content becomes searchable in the chat interface</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}