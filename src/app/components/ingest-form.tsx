'use client';

import { useState } from 'react';
import { Upload, Link, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface IngestResult {
  success: boolean;
  document?: {
    id: number;
    url?: string;
    title?: string;
    chunksCreated: number;
    totalChunks: number;
  };
  error?: string;
}

export default function IngestForm() {
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const body: any = {
        chunkSize: 1000,
        chunkOverlap: 100
      };

      if (activeTab === 'url') {
        if (!url.trim()) {
          throw new Error('Please enter a URL');
        }
        body.url = url.trim();
      } else {
        if (!content.trim() || !title.trim()) {
          throw new Error('Please enter both title and content');
        }
        body.content = content.trim();
        body.title = title.trim();
      }

      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to ingest content');
      }

      setResult(data);
      
      // Clear form on success
      if (data.success) {
        setUrl('');
        setContent('');
        setTitle('');
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Ingest Content</h2>
      
      {/* Tab Selection */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'url'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Link className="w-4 h-4" />
          <span>URL</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'text'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Text</span>
        </button>
      </div>

      {/* Ingestion Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'url' ? (
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={isLoading}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter a URL to scrape and index its content
            </p>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Document Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your text content here..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 min-h-[200px]"
                disabled={isLoading}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Paste text content to index directly
              </p>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Ingest Content</span>
            </>
          )}
        </button>
      </form>

      {/* Result Display */}
      {result && (
        <div className={`mt-6 p-4 rounded-lg ${
          result.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start space-x-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.success ? 'Content ingested successfully!' : 'Ingestion failed'}
              </p>
              {result.success && result.document && (
                <div className="mt-2 text-sm text-green-700 space-y-1">
                  <p>Document ID: {result.document.id}</p>
                  {result.document.title && <p>Title: {result.document.title}</p>}
                  <p>Chunks created: {result.document.chunksCreated} / {result.document.totalChunks}</p>
                </div>
              )}
              {result.error && (
                <p className="mt-1 text-sm text-red-700">{result.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}