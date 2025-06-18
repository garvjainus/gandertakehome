'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DocService } from '@/services/doc-service';
import { DocMeta, DocUpload, PilotProfile, Aircraft } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Upload, 
  FileText, 
  AlertTriangle,
  Calendar,
  Shield,
  Loader2
} from 'lucide-react';

interface DocumentUploadProps {
  pilots: PilotProfile[];
  aircraft: Aircraft[];
  onSuccess: (doc: DocMeta) => void;
  onCancel: () => void;
}

export function DocumentUpload({ pilots, aircraft, onSuccess, onCancel }: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    entity_type: 'general' as 'pilot' | 'aircraft' | 'general',
    entity_id: '',
    doc_type: 'other' as DocMeta['doc_type'],
    expiry_date: '',
    is_critical: false
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to top when error changes
  useEffect(() => {
    if (error && modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (formData.entity_type !== 'general' && !formData.entity_id) {
      setError('Please select an entity');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const upload: DocUpload = {
        file,
        entity_type: formData.entity_type,
        entity_id: formData.entity_type === 'general' ? undefined : formData.entity_id,
        doc_type: formData.doc_type,
        expiry_date: formData.expiry_date || undefined,
        is_critical: formData.is_critical
      };

      const doc = await DocService.uploadDocument(upload);
      onSuccess(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('image')) return '🖼️';
    if (file.type.includes('word')) return '📝';
    return '📁';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const docTypeLabels = {
    medical_certificate: 'Medical Certificate',
    pilot_license: 'Pilot License',
    flight_review: 'Flight Review',
    insurance: 'Insurance',
    airworthiness: 'Airworthiness Certificate',
    registration: 'Registration',
    weight_balance: 'Weight & Balance',
    maintenance_log: 'Maintenance Log',
    ops_manual: 'Operations Manual',
    emergency_procedures: 'Emergency Procedures',
    checklist: 'Checklist',
    other: 'Other'
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent 
        ref={modalContentRef}
        className="max-w-4xl sm:max-w-4xl lg:max-w-4xl max-h-[95vh] overflow-y-auto p-8"
      >
        <DialogHeader className="space-y-4 pb-6 border-b">
          <DialogTitle className="flex items-center text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <Upload className="h-8 w-8 mr-3 text-blue-600" />
            Upload Document
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600">
            Upload compliance documents for pilots, aircraft, or general operations
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-8 mt-8">
          {/* File Upload Section */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="flex items-center text-xl font-semibold">
                <Upload className="h-6 w-6 mr-3 text-blue-600" />
                File Selection
              </CardTitle>
              <CardDescription className="text-base">
                Choose a file to upload or drag and drop
              </CardDescription>
            </CardHeader>
            <CardContent>
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-3xl">{getFileIcon(file)}</span>
                  <div className="text-left">
                        <p className="font-medium text-gray-900 text-lg">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                    <Button
                      variant="outline"
                  onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  Remove file
                    </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PDF, Word, Images up to 10MB
                  </p>
                </div>
                    <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Choose File
                    </Button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
            onChange={handleFileInput}
          />
            </CardContent>
          </Card>

          {/* Document Details */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-lime-50">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="flex items-center text-xl font-semibold">
                <FileText className="h-6 w-6 mr-3 text-green-600" />
                Document Details
              </CardTitle>
              <CardDescription className="text-base">
                Specify document type and associated entity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Entity Type */}
                <div className="space-y-3">
                  <Label className="flex items-center text-base font-medium">
                Document For
                  </Label>
                  <Select
                value={formData.entity_type}
                    onValueChange={(value: 'pilot' | 'aircraft' | 'general') => 
                      setFormData(prev => ({
                  ...prev,
                        entity_type: value,
                  entity_id: ''
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general" className="py-3">General</SelectItem>
                      <SelectItem value="pilot" className="py-3">Pilot</SelectItem>
                      <SelectItem value="aircraft" className="py-3">Aircraft</SelectItem>
                    </SelectContent>
                  </Select>
            </div>

            {/* Entity Selection */}
            {formData.entity_type !== 'general' && (
                  <div className="space-y-3">
                    <Label className="flex items-center text-base font-medium">
                  {formData.entity_type === 'pilot' ? 'Select Pilot' : 'Select Aircraft'}
                    </Label>
                    <Select
                  value={formData.entity_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, entity_id: value }))}
                >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                  {formData.entity_type === 'pilot' 
                    ? pilots.map(pilot => (
                              <SelectItem key={pilot.id} value={pilot.id} className="py-3">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{pilot.first_name} {pilot.last_name}</span>
                                  <span className="text-sm text-gray-500 ml-3">{pilot.role}</span>
                                </div>
                              </SelectItem>
                      ))
                    : aircraft.map(ac => (
                              <SelectItem key={ac.id} value={ac.id} className="py-3">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{ac.tail_number}</span>
                                  <span className="text-sm text-gray-500 ml-3">{ac.model}</span>
                                </div>
                              </SelectItem>
                      ))
                  }
                      </SelectContent>
                    </Select>
              </div>
            )}

            {/* Document Type */}
                <div className="space-y-3">
                  <Label className="flex items-center text-base font-medium">
                Document Type
                  </Label>
                  <Select
                value={formData.doc_type}
                    onValueChange={(value: DocMeta['doc_type']) => 
                      setFormData(prev => ({ ...prev, doc_type: value }))
                    }
              >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                {Object.entries(docTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="py-3">{label}</SelectItem>
                ))}
                    </SelectContent>
                  </Select>
            </div>

            {/* Expiry Date */}
                <div className="space-y-3">
                  <Label className="flex items-center text-base font-medium">
                    <Calendar className="h-4 w-4 mr-2" />
                Expiry Date (Optional)
                  </Label>
                  <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="h-12 text-base"
              />
            </div>
          </div>

          {/* Critical Document Toggle */}
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border">
            <input
              type="checkbox"
              id="is_critical"
              checked={formData.is_critical}
              onChange={(e) => setFormData(prev => ({ ...prev, is_critical: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
                <Label htmlFor="is_critical" className="flex items-center text-base font-medium cursor-pointer">
                  <Shield className="h-4 w-4 mr-2 text-red-500" />
              Critical Document (Operations depend on this document)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isUploading}
              className="px-6 py-3 text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-6 py-3 text-base bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 