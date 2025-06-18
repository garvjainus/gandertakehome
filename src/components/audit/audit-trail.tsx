import React, { useEffect, useState } from 'react'
import { AuditService } from '@/services/audit-service'
import { AuditLogWithUser } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export function AuditTrail() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const auditService = new AuditService()

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const data = await auditService.getAuditLogs(100)
      setLogs(data)
    } catch (err) {
      console.error('Error fetching audit logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="max-w-md mx-auto">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="shadow-lg border bg-gray-200/20 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          Audit Trail
        </CardTitle>
        <CardDescription className="text-gray-600 mt-2">
          Immutable log of all flight records – last {logs.length} events
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">No audit logs found</p>
            <p className="text-gray-400 text-sm mt-1">Flight operations will be logged here</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <Table className="w-full table-fixed">
                <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700 py-4 px-4 w-36">Date</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-4 w-24">Action</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-4 w-32">User</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-4 w-48">Record ID</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-4">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-b-0">
                      <TableCell className="py-4 px-4 w-36">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {format(new Date(log.performed_at), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 w-24">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4 w-32">
                        <div className="text-sm text-gray-900 truncate">
                          {log.pilot_profile && log.pilot_profile.first_name !== 'Unknown'
                            ? `${log.pilot_profile.first_name} ${log.pilot_profile.last_name}`
                            : log.performed_by ? `User ${log.performed_by.substring(0, 8)}...` : 'System'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 w-48">
                        <div className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border truncate">
                          {log.record_id}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="text-sm text-gray-800 leading-relaxed">
                          {log.description || renderChanges(log)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getActionVariant(action: string) {
  switch (action) {
    case 'INSERT':
      return 'default' as const
    case 'UPDATE':
      return 'secondary' as const
    case 'DELETE':
      return 'destructive' as const
    default:
      return 'outline' as const
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'INSERT':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'UPDATE':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'DELETE':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function renderChanges(log: AuditLogWithUser) {
  if (log.action === 'INSERT') {
    return <span className="text-xs">Created record</span>
  }
  if (log.action === 'DELETE') {
    return <span className="text-xs">Deleted record</span>
  }
  // For UPDATE, show changed fields
  if (log.old_data && log.new_data) {
    const changedKeys = Object.keys(log.new_data).filter(
      (key) => JSON.stringify((log.old_data as any)[key]) !== JSON.stringify((log.new_data as any)[key])
    )
    return (
      <span className="text-xs">
        Updated: {changedKeys.join(', ')}
      </span>
    )
  }
  return null
} 