import { checkFlightConflict, formatDateTime, getAircraftAvailability } from './flight-utils'
import { Flight, Aircraft } from '@/types'

describe('Flight Utils', () => {
  const mockAircraft: Aircraft = {
    id: 'aircraft-1',
    tail_number: 'N123AB',
    model: 'Citation CJ3'
  }

  const mockFlights: Flight[] = [
    {
      id: 'flight-1',
      aircraft_id: 'aircraft-1',
      departure_time: '2024-01-15T10:00:00Z',
      arrival_time: '2024-01-15T12:00:00Z',
      origin: 'LAX',
      destination: 'SFO',
      status: 'scheduled'
    },
    {
      id: 'flight-2', 
      aircraft_id: 'aircraft-1',
      departure_time: '2024-01-15T14:00:00Z',
      arrival_time: '2024-01-15T16:00:00Z',
      origin: 'SFO',
      destination: 'LAX',
      status: 'scheduled'
    }
  ]

  describe('checkFlightConflict', () => {
    it('should detect overlap when new flight starts during existing flight', () => {
      const newFlight = {
        aircraft_id: 'aircraft-1',
        departure_time: '2024-01-15T11:00:00Z',
        arrival_time: '2024-01-15T13:00:00Z',
        origin: 'LAX',
        destination: 'SFO'
      }

      const conflict = checkFlightConflict(newFlight, mockFlights)
      expect(conflict).toBe(true)
    })

    it('should detect overlap when new flight ends during existing flight', () => {
      const newFlight = {
        aircraft_id: 'aircraft-1', 
        departure_time: '2024-01-15T09:00:00Z',
        arrival_time: '2024-01-15T11:00:00Z',
        origin: 'LAX',
        destination: 'SFO'
      }

      const conflict = checkFlightConflict(newFlight, mockFlights)
      expect(conflict).toBe(true)
    })

    it('should detect overlap when new flight completely encompasses existing flight', () => {
      const newFlight = {
        aircraft_id: 'aircraft-1',
        departure_time: '2024-01-15T09:00:00Z', 
        arrival_time: '2024-01-15T13:00:00Z',
        origin: 'LAX',
        destination: 'SFO'
      }

      const conflict = checkFlightConflict(newFlight, mockFlights)
      expect(conflict).toBe(true)
    })

    it('should allow non-overlapping flights', () => {
      const newFlight = {
        aircraft_id: 'aircraft-1',
        departure_time: '2024-01-15T08:00:00Z',
        arrival_time: '2024-01-15T09:30:00Z',
        origin: 'LAX',
        destination: 'SFO'
      }

      const conflict = checkFlightConflict(newFlight, mockFlights)
      expect(conflict).toBe(false)
    })

    it('should allow flights for different aircraft', () => {
      const newFlight = {
        aircraft_id: 'aircraft-2',
        departure_time: '2024-01-15T11:00:00Z',
        arrival_time: '2024-01-15T13:00:00Z',
        origin: 'LAX',
        destination: 'SFO'
      }

      const conflict = checkFlightConflict(newFlight, mockFlights)
      expect(conflict).toBe(false)
    })
  })

  describe('formatDateTime', () => {
    it('should format datetime in local format', () => {
      const date = '2024-01-15T10:00:00Z'
      const formatted = formatDateTime(date)
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}/)
    })
  })

  describe('getAircraftAvailability', () => {
    it('should return "Available" when aircraft has no future flights', () => {
      const pastFlights: Flight[] = [
        {
          ...mockFlights[0],
          departure_time: '2024-01-01T10:00:00Z',
          arrival_time: '2024-01-01T12:00:00Z'
        }
      ]

      const availability = getAircraftAvailability(mockAircraft, pastFlights)
      expect(availability).toBe('Available')
    })

    it('should return next flight time when aircraft has future flights', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      
      const futureFlights: Flight[] = [
        {
          ...mockFlights[0],
          departure_time: futureDate.toISOString()
        }
      ]

      const availability = getAircraftAvailability(mockAircraft, futureFlights)
      expect(availability).toContain('Next: ')
    })
  })
}) 