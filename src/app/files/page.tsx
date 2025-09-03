'use client';

import { useState } from 'react';
import { FileText, Upload, Search, AlertCircle } from 'lucide-react';
import FileUpload from '@/components/file-upload';
import FileList from '@/components/file-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FilesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleUploadComplete = (files: any[]) => {
    const successfulUploads = files.filter(file => file.status === 'success');
    
    if (successfulUploads.length > 0) {
      setShowSuccessMessage(true);
      // Refresh the file list
      setRefreshTrigger(prev => prev + 1);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    }
  };

  const handleFileDeleted = (fileId: string) => {
    // File list component handles the removal
    // This could be used for additional actions if needed
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
              <p className="text-gray-600">
                Upload and manage your documents for AI-powered search and retrieval
              </p>
            </div>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Files uploaded successfully!</span>
                <span className="text-green-600">
                  Your files are being processed and will be searchable in the chat soon.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card variant="bordered">
            <CardContent className="p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-3 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
              <p className="text-gray-600 text-sm">
                Drag and drop or click to upload PDF, DOCX, TXT, MD, and CSV files up to 10MB each.
              </p>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6 text-center">
              <Search className="w-8 h-8 mx-auto mb-3 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">AI-Powered Search</h3>
              <p className="text-gray-600 text-sm">
                Your uploaded content becomes instantly searchable through semantic AI search in the chat.
              </p>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-3 text-purple-500" />
              <h3 className="text-lg font-semibold mb-2">Smart Processing</h3>
              <p className="text-gray-600 text-sm">
                Files are automatically chunked, embedded, and indexed for optimal retrieval performance.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Upload New Files
              </h2>
              <p className="text-gray-600">
                Add documents to your knowledge base. Supported formats: PDF, DOCX, TXT, MD, CSV.
              </p>
            </div>
            <FileUpload 
              onUploadComplete={handleUploadComplete}
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
            />
          </div>

          {/* File List Section */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your Documents
              </h2>
              <p className="text-gray-600">
                View and manage your uploaded files. All content is searchable in the chat.
              </p>
            </div>
            <FileList 
              refreshTrigger={refreshTrigger}
              onFileDeleted={handleFileDeleted}
            />
          </div>
        </div>

        {/* Usage Guidelines */}
        <Card variant="bordered" className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Usage Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-gray-900">File Requirements</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Maximum file size: 10MB per file</li>
                  <li>• Maximum files per upload: 5 files</li>
                  <li>• Supported formats: PDF, DOCX, TXT, MD, CSV</li>
                  <li>• Files are automatically processed and indexed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-900">Best Practices</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use descriptive file names for better organization</li>
                  <li>• Ensure text is readable and well-formatted</li>
                  <li>• Upload related documents together for context</li>
                  <li>• Delete outdated files to keep your knowledge base current</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}