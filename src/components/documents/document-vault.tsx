'use client';

import React, { useState, useEffect } from 'react';
import { DocService } from '@/services/doc-service';
import { DocMeta, DocComplianceStatus, DocFilterOptions, PilotProfile, Aircraft } from '@/types';

// Import components inline to avoid circular dependencies
// Components will be defined below
import { 
  FileText, 
  Upload, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search
} from 'lucide-react';
import { DocumentUpload } from './document-upload';
import { DocumentList } from './document-list';
import { ComplianceDashboard } from './compliance-dashboard';

interface DocumentVaultProps {
  pilots: PilotProfile[];
  aircraft: Aircraft[];
}

export function DocumentVault({ pilots, aircraft }: DocumentVaultProps) {
  const [documents, setDocuments] = useState<DocMeta[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<DocComplianceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'compliance'>('documents');
  const [filters, setFilters] = useState<DocFilterOptions>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
    // Check storage bucket exists but don't show error immediately
    // The error will be shown when user actually tries to upload
    DocService.ensureBucketExists().then(exists => {
      if (!exists) {
        console.warn('Storage bucket check failed - upload may not work');
      }
    });
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [docsData, complianceData] = await Promise.all([
        DocService.getDocuments(),
        DocService.getComplianceStatus()
      ]);
      setDocuments(docsData);
      setComplianceStatus(complianceData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const docsData = await DocService.getDocuments(filters);
      setDocuments(docsData);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleUploadSuccess = (newDoc: DocMeta) => {
    setDocuments(prev => [newDoc, ...prev]);
    setShowUpload(false);
    // Clear any previous errors since upload was successful
    setError(null);
    // Refresh compliance status
    DocService.getComplianceStatus().then(setComplianceStatus);
  };

  const handleUploadError = (error: string) => {
    setError(`Upload failed: ${error}`);
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await DocService.deleteDocument(docId);
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      // Refresh compliance status
      DocService.getComplianceStatus().then(setComplianceStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleDownloadDocument = async (docId: string) => {
    try {
      const { blob, filename } = await DocService.downloadDocument(docId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      doc.original_filename.toLowerCase().includes(searchLower) ||
      doc.doc_type.toLowerCase().includes(searchLower) ||
      doc.entity_type.toLowerCase().includes(searchLower)
    );
  });

  const getEntityName = (doc: DocMeta): string => {
    if (doc.entity_type === 'general') return 'General';
    
    if (doc.entity_type === 'pilot') {
      const pilot = pilots.find(p => p.id === doc.entity_id);
      return pilot ? `${pilot.first_name} ${pilot.last_name}` : 'Unknown Pilot';
    }
    
    if (doc.entity_type === 'aircraft') {
      const ac = aircraft.find(a => a.id === doc.entity_id);
      return ac ? ac.tail_number : 'Unknown Aircraft';
    }
    
    return 'Unknown';
  };

  // Calculate summary stats
  const totalDocs = documents.length;
  const expiredDocs = documents.filter(doc => 
    doc.expiry_date && new Date(doc.expiry_date) < new Date()
  ).length;
  const expiringSoonDocs = documents.filter(doc => {
    if (!doc.expiry_date) return false;
    const expiryDate = new Date(doc.expiry_date);
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return expiryDate >= now && expiryDate <= thirtyDaysFromNow;
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              Document Vault
            </h1>
            <p className="text-gray-600 mt-1">
              Manage compliance documents for pilots and aircraft
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Document
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Documents</p>
                <p className="text-2xl font-bold text-blue-900">{totalDocs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-red-600 font-medium">Expired</p>
                <p className="text-2xl font-bold text-red-900">{expiredDocs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-amber-600 mr-2" />
              <div>
                <p className="text-sm text-amber-600 font-medium">Expiring Soon</p>
                <p className="text-2xl font-bold text-amber-900">{expiringSoonDocs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-600 font-medium">Up to Date</p>
                <p className="text-2xl font-bold text-green-900">
                  {totalDocs - expiredDocs - expiringSoonDocs}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'compliance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Compliance Overview
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'documents' ? (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filters.entity_type || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      entity_type: e.target.value as 'pilot' | 'aircraft' | 'general' | undefined || undefined 
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Entities</option>
                    <option value="pilot">Pilots</option>
                    <option value="aircraft">Aircraft</option>
                    <option value="general">General</option>
                  </select>
                  
                  <select
                    value={filters.expiry_status || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      expiry_status: e.target.value as 'all' | 'expired' | 'expiring_soon' | 'valid' | undefined || undefined 
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="expired">Expired</option>
                    <option value="expiring_soon">Expiring Soon</option>
                    <option value="valid">Valid</option>
                  </select>
                </div>
              </div>

              {/* Document List */}
              <DocumentList
                documents={filteredDocuments}
                pilots={pilots}
                aircraft={aircraft}
                onDelete={handleDeleteDocument}
                onDownload={handleDownloadDocument}
                getEntityName={getEntityName}
              />
            </div>
          ) : (
            <ComplianceDashboard 
              complianceStatus={complianceStatus}
              onRefresh={loadData}
            />
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <DocumentUpload
          pilots={pilots}
          aircraft={aircraft}
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUpload(false)}
        />
      )}
    </div>
  );
} 