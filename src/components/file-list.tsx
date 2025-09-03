'use client';

import { useState, useEffect } from 'react';
import { FileText, File, Trash2, Search, Filter, Calendar, HardDrive } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

interface FileDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  source_type: string;
  metadata: any;
  created_at: string;
  chunk_count?: number;
}

interface FileListProps {
  onFileDeleted?: (fileId: string) => void;
  refreshTrigger?: number;
}

export default function FileList({ onFileDeleted, refreshTrigger }: FileListProps) {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      // Add timestamp to prevent caching
      const response = await fetch(`/api/files?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched files:', data.files?.length || 0, 'files');
        setFiles(data.files || []);
      } else {
        console.error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(fileId);
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });

      if (response.ok) {
        // Remove from local state immediately
        setFiles(prev => prev.filter(file => file.id !== fileId));
        
        // Also trigger a full refresh to ensure consistency
        setTimeout(() => {
          fetchFiles();
        }, 500);
        
        if (onFileDeleted) {
          onFileDeleted(fileId);
        }
      } else {
        const error = await response.json();
        alert(`Failed to delete file: ${error.error}`);
        // Refresh the list to ensure we have the latest state
        fetchFiles();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
      // Refresh the list to ensure we have the latest state
      fetchFiles();
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    if (isNaN(Number(bytes))) return 'Unknown size';
    const numBytes = Number(bytes);
    if (numBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getFileIcon = (fileType: string | null | undefined) => {
    if (!fileType) return '📄';
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('docx')) return '📝';
    if (type.includes('text') || type.includes('txt')) return '📋';
    if (type.includes('csv')) return '📊';
    if (type.includes('markdown') || type.includes('md')) return '📝';
    return '📄';
  };

  const getFileTypeColor = (fileType: string | null | undefined) => {
    if (!fileType) return 'bg-gray-100 text-gray-800';
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return 'bg-red-100 text-red-800';
    if (type.includes('word') || type.includes('docx')) return 'bg-blue-100 text-blue-800';
    if (type.includes('text') || type.includes('txt')) return 'bg-gray-100 text-gray-800';
    if (type.includes('csv')) return 'bg-green-100 text-green-800';
    if (type.includes('markdown') || type.includes('md')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Filter and sort files
  const filteredAndSortedFiles = files
    .filter(file => {
      const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || file.file_type.includes(selectedType);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.file_name.localeCompare(b.file_name);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'size':
          comparison = a.file_size - b.file_size;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const fileTypes = Array.from(new Set(files.map(file => {
    if (file.file_type?.includes('pdf')) return 'pdf';
    if (file.file_type?.includes('word') || file.file_type?.includes('docx')) return 'docx';
    if (file.file_type?.includes('text')) return 'text';
    if (file.file_type?.includes('csv')) return 'csv';
    if (file.file_type?.includes('markdown')) return 'markdown';
    return 'other';
  }))).filter(Boolean);

  const totalFiles = files.length;
  const totalSize = files.reduce((sum, file) => sum + (file.file_size || 0), 0);

  if (loading) {
    return (
      <Card variant="bordered">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading files...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Files</p>
                <p className="text-2xl font-bold text-gray-900">{totalFiles}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">{formatFileSize(totalSize)}</p>
              </div>
              <HardDrive className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">File Types</p>
                <p className="text-2xl font-bold text-gray-900">{fileTypes.length}</p>
              </div>
              <File className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word Documents</option>
              <option value="text">Text Files</option>
              <option value="csv">CSV Files</option>
              <option value="markdown">Markdown</option>
            </select>

            {/* Sort Options */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </Button>
            </div>
          </div>

          {/* File List */}
          {filteredAndSortedFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {files.length === 0 ? 'No files uploaded yet' : 'No files match your search'}
              </p>
              <p className="text-gray-600">
                {files.length === 0 
                  ? 'Upload your first file to get started'
                  : 'Try adjusting your search or filters'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">
                      {getFileIcon(file.file_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {file.file_name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getFileTypeColor(file.file_type)}`}>
                          {file.file_type?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatFileSize(file.file_size)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(file.created_at)}
                        </span>
                        {file.chunk_count && (
                          <span>
                            {file.chunk_count} chunks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id, file.file_name)}
                      disabled={deleting === file.id}
                      className="text-gray-400 hover:text-red-500"
                    >
                      {deleting === file.id ? (
                        <div className="w-4 h-4 animate-pulse">...</div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}