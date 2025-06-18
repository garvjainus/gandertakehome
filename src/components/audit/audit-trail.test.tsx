import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

// Provide manual mock of AuditService to avoid importing actual module
jest.mock('@/services/audit-service', () => {
  return {
    AuditService: jest.fn().mockImplementation(() => ({
      getAuditLogs: jest.fn(),
    })),
  }
})

import { AuditTrail } from './audit-trail'
import { AuditService } from '@/services/audit-service'

const sampleLogs = [
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
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    },
  },
]

beforeEach(() => {
  // @ts-ignore
  AuditService.mockClear()
  // Set getAuditLogs resolve value
  // @ts-ignore
  AuditService.mockImplementation(() => ({
    getAuditLogs: jest.fn().mockResolvedValue(sampleLogs),
  }))
})

describe('AuditTrail component', () => {
  it('renders audit logs table', async () => {
    render(<AuditTrail />)

    await waitFor(() => expect(screen.getByText('Audit Trail')).toBeInTheDocument())

    expect(screen.getByText('INSERT')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('flight-1')).toBeInTheDocument()
  })
}) 