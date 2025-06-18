import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { FlightDetailsModal } from './flight-details-modal'
import { FlightWithDetails } from '@/types'

const mockFlight: FlightWithDetails = {
  id: 'flight-123',
  aircraft_id: 'aircraft-1',
  captain_id: 'pilot-1',
  first_officer_id: 'pilot-2',
  departure_time: '2024-01-15T10:00:00Z',
  arrival_time: '2024-01-15T12:30:00Z',
  origin: 'LAX',
  destination: 'SFO',
  status: 'scheduled',
  flight_type: 'charter',
  passenger_count: 4,
  notes: 'VIP client - special handling required',
  created_at: '2024-01-10T08:00:00Z',
  updated_at: '2024-01-10T08:00:00Z',
  aircraft: {
    id: 'aircraft-1',
    tail_number: 'N123AB',
    model: 'Citation X',
    manufacturer: 'Cessna',
    year_manufactured: 2020,
    max_passengers: 8,
    max_range_nm: 3400,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  captain: {
    id: 'pilot-1',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1-555-0123',
    license_type: 'ATP',
    medical_expiry: '2024-12-31T00:00:00Z',
    flight_review_expiry: '2024-10-31T00:00:00Z',
    total_hours: 5500,
    pic_hours: 3200,
    instrument_hours: 1800,
    is_active: true,
    role: 'captain',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  first_officer: {
    id: 'pilot-2',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane.doe@example.com',
    phone: '+1-555-0124',
    license_type: 'Commercial',
    medical_expiry: '2024-11-30T00:00:00Z',
    flight_review_expiry: '2024-09-30T00:00:00Z',
    total_hours: 2100,
    pic_hours: 800,
    instrument_hours: 600,
    is_active: true,
    role: 'first_officer',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
}

describe('FlightDetailsModal', () => {
  const defaultProps = {
    flight: mockFlight,
    open: true,
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders flight details when modal is open', () => {
    render(<FlightDetailsModal {...defaultProps} />)

    // Check for flight route information
    expect(screen.getByText('LAX')).toBeInTheDocument()
    expect(screen.getByText('SFO')).toBeInTheDocument()
    
    // Check for aircraft information
    expect(screen.getByText('N123AB')).toBeInTheDocument()
    expect(screen.getByText('Citation X')).toBeInTheDocument()
    expect(screen.getByText('Cessna')).toBeInTheDocument()
    
    // Check for crew information
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('ATP')).toBeInTheDocument()
    expect(screen.getByText('Commercial')).toBeInTheDocument()
    
    // Check for flight details
    expect(screen.getByText('charter')).toBeInTheDocument()
    expect(screen.getByText('scheduled')).toBeInTheDocument()
    expect(screen.getByText('4 passengers')).toBeInTheDocument()
    
    // Check for notes
    expect(screen.getByText('VIP client - special handling required')).toBeInTheDocument()
  })

  it('does not render when modal is closed', () => {
    render(<FlightDetailsModal {...defaultProps} open={false} />)
    
    expect(screen.queryByText('Flight Details')).not.toBeInTheDocument()
    expect(screen.queryByText('LAX')).not.toBeInTheDocument()
  })

  it('does not render when flight is null', () => {
    render(<FlightDetailsModal {...defaultProps} flight={null} />)
    
    expect(screen.queryByText('Flight Details')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = jest.fn()
    render(<FlightDetailsModal {...defaultProps} onClose={onCloseMock} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it('displays aircraft specifications correctly', () => {
    render(<FlightDetailsModal {...defaultProps} />)
    
    expect(screen.getByText('8')).toBeInTheDocument() // max passengers
    expect(screen.getByText('3400 nm')).toBeInTheDocument() // max range
    expect(screen.getByText('2020')).toBeInTheDocument() // year manufactured
  })

  it('displays pilot contact information correctly', () => {
    render(<FlightDetailsModal {...defaultProps} />)
    
    expect(screen.getByText('john.smith@example.com')).toBeInTheDocument()
    expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument()
    expect(screen.getByText('+1-555-0123')).toBeInTheDocument()
    expect(screen.getByText('+1-555-0124')).toBeInTheDocument()
  })

  it('displays pilot hours correctly', () => {
    render(<FlightDetailsModal {...defaultProps} />)
    
    expect(screen.getByText('5,500 total hours • 3,200 PIC hours')).toBeInTheDocument()
    expect(screen.getByText('2,100 total hours • 800 PIC hours')).toBeInTheDocument()
  })

  it('handles flight without captain gracefully', () => {
    const flightWithoutCaptain = {
      ...mockFlight,
      captain: undefined,
      captain_id: undefined,
    }
    
    render(<FlightDetailsModal {...defaultProps} flight={flightWithoutCaptain} />)
    
    expect(screen.getByText('No Captain Assigned')).toBeInTheDocument()
    expect(screen.queryByText('John Smith')).not.toBeInTheDocument()
  })

  it('handles flight without first officer gracefully', () => {
    const flightWithoutFO = {
      ...mockFlight,
      first_officer: undefined,
      first_officer_id: undefined,
    }
    
    render(<FlightDetailsModal {...defaultProps} flight={flightWithoutFO} />)
    
    expect(screen.getByText('No First Officer Assigned')).toBeInTheDocument()
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
  })

  it('displays flight duration correctly', () => {
    render(<FlightDetailsModal {...defaultProps} />)
    
    // Duration should be 2h 30m (10:00 to 12:30)
    expect(screen.getByText('2h 30m')).toBeInTheDocument()
  })

  it('does not display notes section when no notes exist', () => {
    const flightWithoutNotes = {
      ...mockFlight,
      notes: undefined,
    }
    
    render(<FlightDetailsModal {...defaultProps} flight={flightWithoutNotes} />)
    
    expect(screen.queryByText('Flight Notes')).not.toBeInTheDocument()
  })
}) 