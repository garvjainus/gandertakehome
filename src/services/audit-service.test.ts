import { AuditService } from './audit-service'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('AuditService', () => {
  let auditService: AuditService
  
  beforeEach(() => {
    auditService = new AuditService()
    jest.clearAllMocks()
  })

  describe('getAuditLogs', () => {
    it('should fetch all audit logs with correct query', async () => {
      const mockData = [
        {
          id: '1',
          table_name: 'flights',
          record_id: 'flight-1',
          action: 'INSERT',
          old_data: null,
          new_data: { status: 'scheduled' },
          performed_at: '2024-01-01T10:00:00Z',
          performed_by: 'user-1'
        }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockData, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await auditService.getAuditLogs()

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_log')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.order).toHaveBeenCalledWith('performed_at', { ascending: false })
      expect(mockQuery.limit).toHaveBeenCalledWith(100)
      expect(result).toEqual([
        {
          id: '1',
          table_name: 'flights',
          record_id: 'flight-1',
          action: 'INSERT',
          old_data: null,
          new_data: { status: 'scheduled' },
          performed_at: '2024-01-01T10:00:00Z',
          performed_by: 'user-1',
          pilot_profile: {
            first_name: 'Unknown',
            last_name: 'User',
            email: 'user-1'
          }
        }
      ])
    })

    it('should handle custom limit', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      await auditService.getAuditLogs(50)

      expect(mockQuery.limit).toHaveBeenCalledWith(50)
    })

    it('should throw error if supabase query fails', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      await expect(auditService.getAuditLogs()).rejects.toThrow('Database error')
    })
  })

  describe('getAuditLogsForRecord', () => {
    it('should fetch audit logs for specific record', async () => {
      const mockData = [
        {
          id: '1',
          table_name: 'flights',
          record_id: 'flight-1',
          action: 'INSERT',
          old_data: null,
          new_data: { status: 'scheduled' },
          performed_at: '2024-01-01T10:00:00Z',
          performed_by: 'user-1'
        }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await auditService.getAuditLogsForRecord('flights', 'flight-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_log')
      expect(mockQuery.eq).toHaveBeenCalledWith('table_name', 'flights')
      expect(mockQuery.eq).toHaveBeenCalledWith('record_id', 'flight-1')
      expect(result).toEqual([
        {
          id: '1',
          table_name: 'flights',
          record_id: 'flight-1',
          action: 'INSERT',
          old_data: null,
          new_data: { status: 'scheduled' },
          performed_at: '2024-01-01T10:00:00Z',
          performed_by: 'user-1',
          pilot_profile: {
            first_name: 'Unknown',
            last_name: 'User',
            email: 'user-1'
          }
        }
      ])
    })
  })

  describe('getAuditLogsWithFilters', () => {
    it('should apply action filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      await auditService.getAuditLogsWithFilters({
        action: 'INSERT',
        table_name: 'flights',
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('action', 'INSERT')
      expect(mockQuery.eq).toHaveBeenCalledWith('table_name', 'flights')
      expect(mockQuery.gte).toHaveBeenCalledWith('performed_at', '2024-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('performed_at', '2024-01-31')
    })

    it('should skip undefined filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      await auditService.getAuditLogsWithFilters({})

      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.order).toHaveBeenCalled()
      expect(mockQuery.limit).toHaveBeenCalled()
      // Should not call any eq/gte/lte methods
    })
  })
}) 