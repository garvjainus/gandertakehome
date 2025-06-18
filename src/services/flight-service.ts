import { supabase } from '@/lib/supabase'
import { Aircraft, Flight, FlightWithDetails, NewFlight, PilotProfile } from '@/types'

export class FlightService {
  async getAircraft(): Promise<Aircraft[]> {
    const { data, error } = await supabase
      .from('aircraft')
      .select('*')
      .eq('is_active', true)
      .order('tail_number')

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }

  async getPilots(): Promise<PilotProfile[]> {
    const { data, error } = await supabase
      .from('pilot_profiles')
      .select('*')
      .eq('is_active', true)
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Error fetching pilots:', error)
      throw new Error(error.message)
    }

    console.log('Fetched pilots:', data?.length || 0, data)
    return data || []
  }

  async getFlights(): Promise<FlightWithDetails[]> {
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('flights')
      .select(`
        *,
        aircraft (*),
        captain:captain_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          license_type,
          total_hours,
          pic_hours,
          instrument_hours,
          role
        ),
        first_officer:first_officer_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          license_type,
          total_hours,
          pic_hours,
          instrument_hours,
          role
        ),
        dispatcher:dispatcher_id (
          id,
          first_name,
          last_name,
          role
        ),
        created_by_pilot:created_by (
          id,
          first_name,
          last_name,
          role
        )
      `)
      .gte('departure_time', now)
      .order('departure_time')

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }

  async getAllFlights(): Promise<FlightWithDetails[]> {
    const { data, error } = await supabase
      .from('flights')
      .select(`
        *,
        aircraft (*),
        captain:captain_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          license_type,
          total_hours,
          pic_hours,
          instrument_hours,
          role
        ),
        first_officer:first_officer_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          license_type,
          total_hours,
          pic_hours,
          instrument_hours,
          role
        ),
        dispatcher:dispatcher_id (
          id,
          first_name,
          last_name,
          role
        ),
        created_by_pilot:created_by (
          id,
          first_name,
          last_name,
          role
        )
      `)
      .order('departure_time')

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }

  async createFlight(newFlight: NewFlight): Promise<Flight> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to create a flight')
    }

    const flightData = {
      ...newFlight,
      flight_type: newFlight.flight_type || 'charter',
      passenger_count: newFlight.passenger_count || 0,
      status: 'scheduled',
      created_by: user.id
    }

    const { data, error } = await supabase
      .from('flights')
      .insert([flightData])
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async updateFlightTimes(flightId: string, departureTime: string, arrivalTime: string): Promise<Flight> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to update a flight')
    }

    const { data, error } = await supabase
      .from('flights')
      .update({
        departure_time: departureTime,
        arrival_time: arrivalTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', flightId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async updateFlight(flightId: string, updates: Partial<Flight>): Promise<Flight> {
    const { data, error } = await supabase
      .from('flights')
      .update(updates)
      .eq('id', flightId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async deleteFlight(flightId: string): Promise<void> {
    const { error } = await supabase
      .from('flights')
      .delete()
      .eq('id', flightId)

    if (error) {
      throw new Error(error.message)
    }
  }

  async getFlightsByPilot(pilotId: string): Promise<FlightWithDetails[]> {
    const { data, error } = await supabase
      .from('flights')
      .select(`
        *,
        aircraft (*),
        captain:captain_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          license_type,
          total_hours,
          pic_hours,
          instrument_hours,
          role
        ),
        first_officer:first_officer_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          license_type,
          total_hours,
          pic_hours,
          instrument_hours,
          role
        )
      `)
      .or(`captain_id.eq.${pilotId},first_officer_id.eq.${pilotId},created_by.eq.${pilotId}`)
      .order('departure_time')

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }

  async getUpcomingFlightsByPilot(pilotId: string): Promise<FlightWithDetails[]> {
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('flights')
      .select(`
        *,
        aircraft (*),
        captain:captain_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          license_type,
          total_hours,
          pic_hours,
          instrument_hours,
          role
        ),
        first_officer:first_officer_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          license_type,
          total_hours,
          pic_hours,
          instrument_hours,
          role
        )
      `)
      .or(`captain_id.eq.${pilotId},first_officer_id.eq.${pilotId}`)
      .gte('departure_time', now)
      .eq('status', 'scheduled')
      .order('departure_time')
      .limit(5)

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }

  // Check if pilot is available for a time period
  async isPilotAvailable(pilotId: string, departureTime: string, arrivalTime: string, excludeFlightId?: string): Promise<boolean> {
    let query = supabase
      .from('flights')
      .select('id')
      .or(`captain_id.eq.${pilotId},first_officer_id.eq.${pilotId}`)
      .eq('status', 'scheduled')
      .or(`departure_time.lt.${arrivalTime},arrival_time.gt.${departureTime}`)

    if (excludeFlightId) {
      query = query.neq('id', excludeFlightId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return (data || []).length === 0
  }

  // Get aircraft utilization statistics
  async getAircraftUtilization(aircraftId: string, days: number = 30): Promise<{
    totalFlights: number;
    totalHours: number;
    averageHoursPerFlight: number;
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('flights')
      .select('departure_time, arrival_time')
      .eq('aircraft_id', aircraftId)
      .gte('departure_time', startDate.toISOString())
      .in('status', ['completed', 'in_progress'])

    if (error) {
      throw new Error(error.message)
    }

    const flights = data || []
    const totalFlights = flights.length
    let totalHours = 0

    flights.forEach(flight => {
      const departure = new Date(flight.departure_time)
      const arrival = new Date(flight.arrival_time)
      const hours = (arrival.getTime() - departure.getTime()) / (1000 * 60 * 60)
      totalHours += hours
    })

    return {
      totalFlights,
      totalHours: Math.round(totalHours * 100) / 100,
      averageHoursPerFlight: totalFlights > 0 ? Math.round((totalHours / totalFlights) * 100) / 100 : 0
    }
  }
} 