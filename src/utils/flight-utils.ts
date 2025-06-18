import { Flight, Aircraft, NewFlight, FlightWithDetails } from '@/types'

/**
 * Check if a new flight conflicts with existing flights for the same aircraft
 */
export function checkFlightConflict(newFlight: NewFlight, existingFlights: Flight[]): boolean {
  const aircraftFlights = existingFlights.filter(
    flight => flight.aircraft_id === newFlight.aircraft_id && flight.status === 'scheduled'
  )

  const newStart = new Date(newFlight.departure_time)
  const newEnd = new Date(newFlight.arrival_time)

  return aircraftFlights.some(flight => {
    const existingStart = new Date(flight.departure_time)
    const existingEnd = new Date(flight.arrival_time)

    // Check for any overlap: new flight starts before existing ends AND new flight ends after existing starts
    return newStart < existingEnd && newEnd > existingStart
  })
}

/**
 * Find all conflicting flights for a given time slot and aircraft
 */
export function findConflictingFlights(
  startTime: Date, 
  endTime: Date, 
  aircraftId: string | null, 
  existingFlights: FlightWithDetails[]
): FlightWithDetails[] {
  // If no specific aircraft, check all aircraft
  const aircraftToCheck = aircraftId ? [aircraftId] : [...new Set(existingFlights.map(f => f.aircraft_id))]
  
  const conflicts: FlightWithDetails[] = []
  
  for (const currentAircraftId of aircraftToCheck) {
    const aircraftFlights = existingFlights.filter(
      flight => flight.aircraft_id === currentAircraftId && flight.status === 'scheduled'
    )

    const conflictingFlights = aircraftFlights.filter(flight => {
      const existingStart = new Date(flight.departure_time)
      const existingEnd = new Date(flight.arrival_time)

      // Check for any overlap
      return startTime < existingEnd && endTime > existingStart
    })

    conflicts.push(...conflictingFlights)
  }

  return conflicts
}

/**
 * Format a datetime string for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString()
}

/**
 * Get aircraft availability status
 */
export function getAircraftAvailability(aircraft: Aircraft, flights: Flight[]): string {
  const now = new Date()
  const aircraftFlights = flights
    .filter(flight => 
      flight.aircraft_id === aircraft.id && 
      flight.status === 'scheduled' &&
      new Date(flight.departure_time) > now
    )
    .sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime())

  if (aircraftFlights.length === 0) {
    return 'Available'
  }

  const nextFlight = aircraftFlights[0]
  const formattedTime = formatDateTime(nextFlight.departure_time)
  return `Next: ${formattedTime}`
} 