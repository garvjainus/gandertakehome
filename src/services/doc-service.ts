import { createClient } from '@supabase/supabase-js';
import { DocMeta, DocAccessLog, DocUpload, DocComplianceStatus, DocFilterOptions } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class DocService {
  private static readonly STORAGE_BUCKET = 'documents';
  private static readonly TIMEOUT_MS = 5000;

  // Upload a document to storage and save metadata
  static async uploadDocument(upload: DocUpload): Promise<DocMeta> {
    return Promise.race([
      this._uploadDocument(upload),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _uploadDocument(upload: DocUpload): Promise<DocMeta> {
    const { file, entity_type, entity_id, doc_type, expiry_date, is_critical = false } = upload;
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const filename = `${entity_type}/${entity_id || 'general'}/${doc_type}_${timestamp}.${fileExt}`;
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      // Provide better error message for bucket not found
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket does not exist')) {
        throw new Error(
          `Storage bucket '${this.STORAGE_BUCKET}' not found. ` +
          `Please create it manually in your Supabase Dashboard → Storage. ` +
          `Go to Storage → Create bucket → Name: '${this.STORAGE_BUCKET}' → Private`
        );
      }
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Save metadata to database
    const docMeta = {
      filename: uploadData.path,
      original_filename: file.name,
      file_path: uploadData.path,
      file_size: file.size,
      mime_type: file.type,
      entity_type,
      entity_id,
      doc_type,
      expiry_date,
      is_critical,
      uploaded_by: user.id
    };

    const { data, error } = await supabase
      .from('docs_meta')
      .insert(docMeta)
      .select()
      .single();

    if (error) {
      // Cleanup uploaded file if metadata save fails
      await supabase.storage.from(this.STORAGE_BUCKET).remove([uploadData.path]);
      throw new Error(`Metadata save failed: ${error.message}`);
    }

    // Log upload action
    await this.logAccess(data.id, 'upload');

    return data;
  }

  // Download a document
  static async downloadDocument(docId: string): Promise<{ blob: Blob; filename: string }> {
    return Promise.race([
      this._downloadDocument(docId),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Download timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _downloadDocument(docId: string): Promise<{ blob: Blob; filename: string }> {
    // Get document metadata
    const { data: docMeta, error: metaError } = await supabase
      .from('docs_meta')
      .select('*')
      .eq('id', docId)
      .single();

    if (metaError) {
      throw new Error(`Document not found: ${metaError.message}`);
    }

    // Download file from storage
    const { data: blob, error: downloadError } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .download(docMeta.file_path);

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    // Log download action
    await this.logAccess(docId, 'download');

    return { blob, filename: docMeta.original_filename };
  }

  // Get documents with optional filters
  static async getDocuments(filters: DocFilterOptions = {}): Promise<DocMeta[]> {
    return Promise.race([
      this._getDocuments(filters),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _getDocuments(filters: DocFilterOptions = {}): Promise<DocMeta[]> {
    let query = supabase.from('docs_meta').select('*');

    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }

    if (filters.entity_id) {
      query = query.eq('entity_id', filters.entity_id);
    }

    if (filters.doc_type) {
      query = query.eq('doc_type', filters.doc_type);
    }

    if (filters.is_critical !== undefined) {
      query = query.eq('is_critical', filters.is_critical);
    }

    // Handle expiry status filter
    if (filters.expiry_status) {
      const now = new Date().toISOString().split('T')[0]; // Today's date
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      switch (filters.expiry_status) {
        case 'expired':
          query = query.lt('expiry_date', now).not('expiry_date', 'is', null);
          break;
        case 'expiring_soon':
          query = query.gte('expiry_date', now).lte('expiry_date', thirtyDaysFromNow);
          break;
        case 'valid':
          query = query.or(`expiry_date.is.null,expiry_date.gt.${now}`);
          break;
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return data || [];
  }

  // Delete a document
  static async deleteDocument(docId: string): Promise<void> {
    return Promise.race([
      this._deleteDocument(docId),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Delete timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _deleteDocument(docId: string): Promise<void> {
    // Get document metadata first
    const { data: docMeta, error: metaError } = await supabase
      .from('docs_meta')
      .select('file_path')
      .eq('id', docId)
      .single();

    if (metaError) {
      throw new Error(`Document not found: ${metaError.message}`);
    }

    // Log delete action before deletion
    await this.logAccess(docId, 'delete');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .remove([docMeta.file_path]);

    if (storageError) {
      console.warn(`Storage delete warning: ${storageError.message}`);
    }

    // Delete metadata (this will cascade to access logs)
    const { error: dbError } = await supabase
      .from('docs_meta')
      .delete()
      .eq('id', docId);

    if (dbError) {
      throw new Error(`Database delete failed: ${dbError.message}`);
    }
  }

  // Get compliance status for all entities
  static async getComplianceStatus(): Promise<DocComplianceStatus[]> {
    return Promise.race([
      this._getComplianceStatus(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Compliance check timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _getComplianceStatus(): Promise<DocComplianceStatus[]> {
    // Get all pilots and aircraft
    const [pilotsResult, aircraftResult, docsResult] = await Promise.all([
      supabase.from('pilot_profiles').select('id, first_name, last_name').eq('is_active', true),
      supabase.from('aircraft').select('id, tail_number').eq('is_active', true),
      supabase.from('docs_meta').select('*')
    ]);

    if (pilotsResult.error) {
      throw new Error(`Failed to fetch pilots: ${pilotsResult.error.message}`);
    }
    if (aircraftResult.error) {
      throw new Error(`Failed to fetch aircraft: ${aircraftResult.error.message}`);
    }
    if (docsResult.error) {
      throw new Error(`Failed to fetch documents: ${docsResult.error.message}`);
    }

    const pilots = pilotsResult.data || [];
    const aircraft = aircraftResult.data || [];
    const docs = docsResult.data || [];

    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const statuses: DocComplianceStatus[] = [];

    // Process pilots
    for (const pilot of pilots) {
      const pilotDocs = docs.filter(doc => doc.entity_type === 'pilot' && doc.entity_id === pilot.id);
      const expiredDocs = pilotDocs.filter(doc => doc.expiry_date && new Date(doc.expiry_date) < now);
      const expiringSoonDocs = pilotDocs.filter(doc => 
        doc.expiry_date && 
        new Date(doc.expiry_date) >= now && 
        new Date(doc.expiry_date) <= thirtyDaysFromNow
      );
      const criticalExpired = expiredDocs.filter(doc => doc.is_critical).length;

      let overallStatus: 'compliant' | 'warning' | 'non_compliant';
      if (criticalExpired > 0) {
        overallStatus = 'non_compliant';
      } else if (expiredDocs.length > 0 || expiringSoonDocs.length > 0) {
        overallStatus = 'warning';
      } else {
        overallStatus = 'compliant';
      }

      statuses.push({
        entity_id: pilot.id,
        entity_type: 'pilot',
        entity_name: `${pilot.first_name} ${pilot.last_name}`,
        total_docs: pilotDocs.length,
        expired_docs: expiredDocs.length,
        expiring_soon_docs: expiringSoonDocs.length,
        critical_expired: criticalExpired,
        overall_status: overallStatus,
        docs: pilotDocs
      });
    }

    // Process aircraft
    for (const ac of aircraft) {
      const aircraftDocs = docs.filter(doc => doc.entity_type === 'aircraft' && doc.entity_id === ac.id);
      const expiredDocs = aircraftDocs.filter(doc => doc.expiry_date && new Date(doc.expiry_date) < now);
      const expiringSoonDocs = aircraftDocs.filter(doc => 
        doc.expiry_date && 
        new Date(doc.expiry_date) >= now && 
        new Date(doc.expiry_date) <= thirtyDaysFromNow
      );
      const criticalExpired = expiredDocs.filter(doc => doc.is_critical).length;

      let overallStatus: 'compliant' | 'warning' | 'non_compliant';
      if (criticalExpired > 0) {
        overallStatus = 'non_compliant';
      } else if (expiredDocs.length > 0 || expiringSoonDocs.length > 0) {
        overallStatus = 'warning';
      } else {
        overallStatus = 'compliant';
      }

      statuses.push({
        entity_id: ac.id,
        entity_type: 'aircraft',
        entity_name: ac.tail_number,
        total_docs: aircraftDocs.length,
        expired_docs: expiredDocs.length,
        expiring_soon_docs: expiringSoonDocs.length,
        critical_expired: criticalExpired,
        overall_status: overallStatus,
        docs: aircraftDocs
      });
    }

    return statuses;
  }

  // Get access logs for a document
  static async getAccessLogs(docId: string): Promise<DocAccessLog[]> {
    return Promise.race([
      this._getAccessLogs(docId),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Access logs timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _getAccessLogs(docId: string): Promise<DocAccessLog[]> {
    const { data, error } = await supabase
      .from('doc_access_log')
      .select('*')
      .eq('doc_id', docId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch access logs: ${error.message}`);
    }

    return data || [];
  }

  // Log document access
  private static async logAccess(docId: string, action: DocAccessLog['action']): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('doc_access_log').insert({
        doc_id: docId,
        accessed_by: user.id,
        action,
        ip_address: null, // Could be populated from request headers in a real app
        user_agent: navigator.userAgent
      });
    } catch (error) {
      // Don't throw on logging errors, just log them
      console.warn('Failed to log document access:', error);
    }
  }

  // Check if storage bucket exists (creation requires manual setup)
  static async ensureBucketExists(): Promise<boolean> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.warn('Failed to list storage buckets:', error.message);
        // Don't throw error here - let upload handle it
        return false;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === this.STORAGE_BUCKET);
      
      if (!bucketExists) {
        console.warn(`Storage bucket '${this.STORAGE_BUCKET}' does not exist.`);
        return false;
      }
      
      console.log(`Storage bucket '${this.STORAGE_BUCKET}' is ready.`);
      return true;
    } catch (error) {
      console.warn('Storage bucket verification failed:', error);
      return false;
    }
  }
} 