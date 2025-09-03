'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  file: File; // Keep reference to original file
}

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/csv': ['.csv'],
  'application/csv': ['.csv']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export default function FileUpload({ 
  onUploadComplete, 
  maxFiles = MAX_FILES, 
  maxSize = MAX_FILE_SIZE 
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    console.log('onDrop called - Accepted files:', acceptedFiles.length, 'Rejected files:', rejectedFiles.length);
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      console.warn('Rejected files:', rejectedFiles);
      rejectedFiles.forEach((file: any) => {
        console.warn(`File rejected: ${file.file?.name || 'unknown'} - Reasons:`, file.errors);
      });
    }

    if (acceptedFiles.length === 0) {
      console.log('No files accepted');
      return;
    }

    // Log accepted files
    acceptedFiles.forEach(file => {
      console.log(`Accepted file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    });

    // Create UploadedFile objects
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      status: 'pending' as const,
      progress: 0,
      file: file // Keep reference to original file
    }));

    console.log('Adding files to state:', newFiles);
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize,
    maxFiles,
    multiple: true,
    disabled: isUploading
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const uploadFiles = async () => {
    if (uploadedFiles.length === 0) {
      console.log('No files to upload');
      return;
    }

    console.log('Starting upload for', uploadedFiles.length, 'files');
    setIsUploading(true);
    const filesToUpload = uploadedFiles.filter(file => file.status === 'pending');
    const uploadResults: UploadedFile[] = [];

    for (const file of filesToUpload) {
      try {
        console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
        
        // Update status to uploading
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'uploading' as const, progress: 0 } 
              : f
          )
        );

        // Create FormData
        const formData = new FormData();
        // Use the original file from the file property
        formData.append('files', file.file);

        // Use fetch API instead of XMLHttpRequest for simplicity
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        console.log(`Upload response for ${file.name}:`, result);

        if (response.ok && result.success) {
          // Update file status to success
          const updatedFile: UploadedFile = {
            ...file,
            status: 'success' as const,
            progress: 100
          };
          
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === file.id ? updatedFile : f
            )
          );
          uploadResults.push(updatedFile);
        } else {
          throw new Error(result.error || `Upload failed: ${response.status}`);
        }

      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        const errorFile: UploadedFile = {
          ...file,
          status: 'error' as const,
          progress: 0,
          error: errorMessage
        };
        
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id ? errorFile : f
          )
        );
        uploadResults.push(errorFile);
      }
    }

    setIsUploading(false);
    console.log('Upload complete. Results:', uploadResults);
    
    if (onUploadComplete && uploadResults.length > 0) {
      onUploadComplete(uploadResults);
    }
  };

  const clearAll = () => {
    setUploadedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getReadableFileType = (file: UploadedFile) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'PDF';
      case 'docx':
        return 'Word Document';
      case 'txt':
        return 'Text File';
      case 'md':
        return 'Markdown';
      case 'csv':
        return 'CSV';
      default:
        if (file.type) {
          if (file.type.includes('pdf')) return 'PDF';
          if (file.type.includes('word')) return 'Word Document';
          if (file.type.includes('text')) return 'Text File';
          if (file.type.includes('csv')) return 'CSV';
          return file.type;
        }
        return 'Unknown';
    }
  };

  const getFileIcon = (file: UploadedFile) => {
    if (file.status === 'uploading') {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    if (file.status === 'success') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (file.status === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const pendingFiles = uploadedFiles.filter(file => file.status === 'pending');
  const hasFiles = uploadedFiles.length > 0;

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card variant="bordered">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragActive && !isDragReject 
                ? 'border-blue-400 bg-blue-50' 
                : isDragReject
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            
            {isDragActive ? (
              <div>
                {isDragReject ? (
                  <p className="text-red-600 font-medium">
                    Some files are not supported
                  </p>
                ) : (
                  <p className="text-blue-600 font-medium">
                    Drop the files here...
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-gray-600 mb-4">
                  Support for PDF, DOCX, TXT, MD, and CSV files
                </p>
                <p className="text-sm text-gray-500">
                  Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {hasFiles && (
        <Card variant="bordered">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Files ({uploadedFiles.length})
              </h3>
              <div className="flex gap-2">
                {pendingFiles.length > 0 && (
                  <Button
                    onClick={uploadFiles}
                    disabled={isUploading}
                    className="flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={clearAll}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{getReadableFileType(file)}</span>
                        {file.status === 'uploading' && (
                          <span>{file.progress}% uploaded</span>
                        )}
                        {file.status === 'error' && file.error && (
                          <span className="text-red-600">{file.error}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar for uploading files */}
                  {file.status === 'uploading' && (
                    <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                  {file.status !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}