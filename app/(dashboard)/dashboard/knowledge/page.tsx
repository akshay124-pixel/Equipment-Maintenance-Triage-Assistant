'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { Alert } from '@/components/ui/Alert';

interface KnowledgeDocument {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  equipmentType: string;
  uploadedAt: string;
  processingStatus: string;
  processingError?: string;
  _count?: {
    chunks: number;
  };
}

interface SearchResult {
  id: string;
  content: string;
  section?: string;
  page?: number;
  similarity?: number;
  document: {
    title: string;
    filename: string;
  };
}

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/knowledge', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      showToast('Error loading documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showToast('Please enter a search query', 'warning');
      return;
    }
    
    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/knowledge/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
        if (data.data.length === 0) {
          showToast('No results found', 'info');
        }
      } else {
        showToast('Search failed', 'error');
      }
    } catch (error) {
      console.error('Error searching:', error);
      showToast('Error performing search', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      showToast('Only PDF files are supported', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be less than 10MB', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('equipmentType', 'General'); // You can add a form to select equipment type

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        showToast('Document uploaded successfully. Processing...', 'success');
        await fetchDocuments();
      } else {
        const error = await response.json();
        showToast(error.error?.message || 'Upload failed', 'error');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Error uploading document', 'error');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const getProcessingBadge = (status: string) => {
    const map: any = {
      pending: { variant: 'warning', label: 'Processing...' },
      completed: { variant: 'success', label: 'Ready' },
      failed: { variant: 'danger', label: 'Failed' },
    };
    return map[status] || { variant: 'gray', label: status };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Header - Modern Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-8 shadow-2xl shadow-purple-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-rose-400/20 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">Knowledge Base</h2>
            </div>
            <p className="text-purple-100 text-lg ml-15">Search maintenance documentation and upload new documents</p>
          </div>
          <div>
            <input
              type="file"
              id="file-upload"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button as="span" disabled={uploading} loading={uploading} variant="secondary" size="lg">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Document
              </Button>
            </label>
          </div>
        </div>
      </div>

      {/* Search - Modern Design */}
      <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 p-6 shadow-xl">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search for maintenance procedures, troubleshooting guides, fault patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <Button onClick={handleSearch} loading={searching} disabled={!searchQuery.trim()} size="lg">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Uses AI-powered semantic search to find relevant maintenance information</span>
        </div>
      </div>

      {/* Search Results - Modern Cards */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Search Results ({searchResults.length})
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setSearchResults([])}>
              Clear Results
            </Button>
          </div>
          {searchResults.map((result, index) => (
            <div key={index} className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:border-purple-200">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-md shadow-purple-500/30">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">
                      {result.document.title}
                    </h4>
                    {result.similarity && (
                      <Badge variant="info" size="sm">
                        {(result.similarity * 100).toFixed(0)}% match
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed">{result.content}</p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {result.document.filename}
                    </span>
                    {result.section && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Section: {result.section}
                      </span>
                    )}
                    {result.page && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-700 rounded-lg font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Page {result.page}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents Library */}
      <Card>
        <CardHeader>Document Library ({documents.length})</CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              title="No documents uploaded"
              description="Upload maintenance manuals, troubleshooting guides, and technical documentation to enable AI-powered search."
            />
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const badge = getProcessingBadge(doc.processingStatus);
                return (
                  <div
                    key={doc.id}
                    className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-white/60 backdrop-blur-sm p-5 hover:bg-white hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 shadow-md shadow-red-500/30 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h4 className="font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">{doc.title}</h4>
                          <Badge variant={badge.variant as any} size="sm">
                            {badge.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 font-medium">{doc.filename}</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">{formatFileSize(doc.fileSize)}</span>
                          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg font-medium">{doc.equipmentType}</span>
                          <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-lg font-medium">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                          {doc._count && doc._count.chunks > 0 && (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                              {doc._count.chunks} chunks
                            </span>
                          )}
                        </div>
                        {doc.processingError && (
                          <Alert variant="danger" className="mt-3">
                            <p className="text-sm">Processing failed: {doc.processingError}</p>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Instructions */}
      <Card>
        <CardHeader>Upload Guidelines</CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Upload PDF documents containing maintenance procedures, troubleshooting guides, and technical specifications</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Documents are automatically chunked and vectorized for semantic search</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Maximum file size: 10MB per document</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Processing may take a few minutes depending on document size</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

