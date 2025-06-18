'use client';

import React from 'react';
import { DocMeta, PilotProfile, Aircraft } from '@/types';
import { 
  Download, 
  Trash2, 
  FileText,
  Calendar,
  AlertTriangle,
  Shield,
  Clock
} from 'lucide-react';

interface DocumentListProps {
  documents: DocMeta[];
  pilots: PilotProfile[];
  aircraft: Aircraft[];
  onDelete: (docId: string) => void;
  onDownload: (docId: string) => void;
  getEntityName: (doc: DocMeta) => string;
}

export function DocumentList({ 
  documents, 
  pilots, 
  aircraft, 
  onDelete, 
  onDownload, 
  getEntityName 
}: DocumentListProps) {
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getExpiryStatus = (doc: DocMeta): 'expired' | 'expiring_soon' | 'valid' | 'no_expiry' => {
    if (!doc.expiry_date) return 'no_expiry';
    
    const expiryDate = new Date(doc.expiry_date);
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    if (expiryDate < now) return 'expired';
    if (expiryDate <= thirtyDaysFromNow) return 'expiring_soon';
    return 'valid';
  };

  const getStatusBadge = (doc: DocMeta) => {
    const status = getExpiryStatus(doc);
    
    switch (status) {
      case 'expired':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </span>
        );
      case 'expiring_soon':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3 mr-1" />
            Expiring Soon
          </span>
        );
      case 'valid':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Valid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            No Expiry
          </span>
        );
    }
  };

  const formatDocType = (docType: string): string => {
    return docType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
        <p className="text-gray-500">Upload your first document to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Document
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Entity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expiry Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center">
                      {doc.original_filename}
                      {doc.is_critical && (
                        <Shield className="h-4 w-4 text-red-500 ml-2" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {doc.mime_type}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {formatDocType(doc.doc_type)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{getEntityName(doc)}</div>
                <div className="text-sm text-gray-500 capitalize">{doc.entity_type}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(doc)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {doc.expiry_date ? (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(doc.expiry_date)}
                  </div>
                ) : (
                  'No expiry'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(doc.file_size)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(doc.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onDownload(doc.id)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this document?')) {
                        onDelete(doc.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 