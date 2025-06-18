import { supabase } from '@/lib/supabase'
import { AuditLogWithUser, AuditLogFilters } from '@/types'

export class AuditService {
  /**
   * Get audit logs with optional limit
   */
  async getAuditLogs(limit: number = 100): Promise<AuditLogWithUser[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('performed_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(error.message)
    }

    // For now, return data without user details
    // We can enhance this later by properly joining through auth.users
    return (data || []).map(log => ({
      ...log,
      pilot_profile: {
        first_name: 'Unknown',
        last_name: 'User',
        email: log.performed_by || 'system'
      }
    }))
  }

  /**
   * Get audit logs for a specific record
   */
  async getAuditLogsForRecord(tableName: string, recordId: string): Promise<AuditLogWithUser[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('performed_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data || []).map(log => ({
      ...log,
      pilot_profile: {
        first_name: 'Unknown',
        last_name: 'User',
        email: log.performed_by || 'system'
      }
    }))
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogsWithFilters(filters: AuditLogFilters, limit: number = 100): Promise<AuditLogWithUser[]> {
    let query = supabase
      .from('audit_log')
      .select('*')

    // Apply filters
    if (filters.action) {
      query = query.eq('action', filters.action)
    }

    if (filters.table_name) {
      query = query.eq('table_name', filters.table_name)
    }

    if (filters.performed_by) {
      query = query.eq('performed_by', filters.performed_by)
    }

    if (filters.date_from) {
      query = query.gte('performed_at', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('performed_at', filters.date_to)
    }

    const { data, error } = await query
      .order('performed_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(error.message)
    }

    return (data || []).map(log => ({
      ...log,
      pilot_profile: {
        first_name: 'Unknown',
        last_name: 'User',
        email: log.performed_by || 'system'
      }
    }))
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(): Promise<{
    totalLogs: number;
    actionCounts: { action: string; count: number }[];
    recentActivity: number; // logs in last 24 hours
  }> {
    // Get total count
    const { count: totalLogs, error: countError } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw new Error(countError.message)
    }

    // Get action counts
    const { data: actionData, error: actionError } = await supabase
      .from('audit_log')
      .select('action')

    if (actionError) {
      throw new Error(actionError.message)
    }

    const actionCounts = actionData?.reduce((acc, log) => {
      const existing = acc.find(item => item.action === log.action)
      if (existing) {
        existing.count++
      } else {
        acc.push({ action: log.action, count: 1 })
      }
      return acc
    }, [] as { action: string; count: number }[]) || []

    // Get recent activity (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { count: recentActivity, error: recentError } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .gte('performed_at', yesterday.toISOString())

    if (recentError) {
      throw new Error(recentError.message)
    }

    return {
      totalLogs: totalLogs || 0,
      actionCounts,
      recentActivity: recentActivity || 0
    }
  }
} 