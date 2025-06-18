import { createClient } from '@supabase/supabase-js';
import { 
  FuelEvent, 
  FuelEventCreate, 
  FuelEfficiencySummary, 
  FlightFuelSummary, 
  FuelFilterOptions,
  Aircraft,
  Flight
} from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class FuelService {
  private static readonly TIMEOUT_MS = 5000;

  // Create a new fuel event
  static async createFuelEvent(fuelEvent: FuelEventCreate): Promise<FuelEvent> {
    return Promise.race([
      this._createFuelEvent(fuelEvent),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Create fuel event timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _createFuelEvent(fuelEvent: FuelEventCreate): Promise<FuelEvent> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Prepare the fuel event data
    const fuelEventData = {
      ...fuelEvent,
      recorded_by: user.id,
      event_date: fuelEvent.event_date || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('fuel_events')
      .insert(fuelEventData)
      .select()
      .single();

    if (error) {
      console.error('Fuel event creation error:', error);
      throw new Error(`Failed to create fuel event: ${error.message}`);
    }

    return data;
  }

  // Get fuel events with optional filters
  static async getFuelEvents(filters: FuelFilterOptions = {}): Promise<FuelEvent[]> {
    return Promise.race([
      this._getFuelEvents(filters),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Fetch fuel events timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _getFuelEvents(filters: FuelFilterOptions = {}): Promise<FuelEvent[]> {
    let query = supabase.from('fuel_events').select('*');

    if (filters.aircraft_id) {
      query = query.eq('aircraft_id', filters.aircraft_id);
    }

    if (filters.event_type) {
      query = query.eq('event_type', filters.event_type);
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.supplier) {
      query = query.ilike('supplier', `%${filters.supplier}%`);
    }

    if (filters.date_from) {
      query = query.gte('event_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('event_date', filters.date_to);
    }

    const { data, error } = await query.order('event_date', { ascending: false });

    if (error) {
      console.error('Fuel events fetch error:', error);
      throw new Error(`Failed to fetch fuel events: ${error.message}`);
    }

    return data || [];
  }

  // Get fuel efficiency summary for all aircraft
  static async getFuelEfficiencySummary(): Promise<FuelEfficiencySummary[]> {
    return Promise.race([
      this._getFuelEfficiencySummary(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Fuel efficiency summary timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _getFuelEfficiencySummary(): Promise<FuelEfficiencySummary[]> {
    const { data, error } = await supabase
      .from('fuel_efficiency_summary')
      .select('*')
      .order('tail_number');

    if (error) {
      console.error('Fuel efficiency summary error:', error);
      throw new Error(`Failed to fetch fuel efficiency summary: ${error.message}`);
    }

    return data || [];
  }

  // Get flight fuel summary
  static async getFlightFuelSummary(filters: { aircraft_id?: string; limit?: number } = {}): Promise<FlightFuelSummary[]> {
    return Promise.race([
      this._getFlightFuelSummary(filters),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Flight fuel summary timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _getFlightFuelSummary(filters: { aircraft_id?: string; limit?: number } = {}): Promise<FlightFuelSummary[]> {
    let query = supabase.from('flight_fuel_summary').select('*');

    if (filters.aircraft_id) {
      query = query.eq('aircraft_id', filters.aircraft_id);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query.order('departure_time', { ascending: false });

    if (error) {
      console.error('Flight fuel summary error:', error);
      throw new Error(`Failed to fetch flight fuel summary: ${error.message}`);
    }

    return data || [];
  }

  // Update a fuel event
  static async updateFuelEvent(id: string, updates: Partial<FuelEventCreate>): Promise<FuelEvent> {
    return Promise.race([
      this._updateFuelEvent(id, updates),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Update fuel event timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _updateFuelEvent(id: string, updates: Partial<FuelEventCreate>): Promise<FuelEvent> {
    const { data, error } = await supabase
      .from('fuel_events')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Fuel event update error:', error);
      throw new Error(`Failed to update fuel event: ${error.message}`);
    }

    return data;
  }

  // Delete a fuel event
  static async deleteFuelEvent(id: string): Promise<void> {
    return Promise.race([
      this._deleteFuelEvent(id),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Delete fuel event timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _deleteFuelEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('fuel_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Fuel event delete error:', error);
      throw new Error(`Failed to delete fuel event: ${error.message}`);
    }
  }

  // Get fuel events for a specific flight
  static async getFuelEventsForFlight(flightId: string): Promise<FuelEvent[]> {
    return Promise.race([
      this._getFuelEventsForFlight(flightId),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Fetch flight fuel events timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _getFuelEventsForFlight(flightId: string): Promise<FuelEvent[]> {
    const { data, error } = await supabase
      .from('fuel_events')
      .select('*')
      .eq('flight_id', flightId)
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Flight fuel events fetch error:', error);
      throw new Error(`Failed to fetch fuel events for flight: ${error.message}`);
    }

    return data || [];
  }

  // Calculate fuel efficiency metrics for an aircraft
  static async getAircraftFuelMetrics(aircraftId: string, months: number = 12): Promise<{
    totalFuelCost: number;
    totalFuelQuantity: number;
    avgPricePerGallon: number;
    avgGalPerNm: number;
    avgCostPerNm: number;
    totalFlights: number;
    avgBurnVariance: number;
  }> {
    return Promise.race([
      this._getAircraftFuelMetrics(aircraftId, months),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Aircraft fuel metrics timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _getAircraftFuelMetrics(aircraftId: string, months: number = 12): Promise<{
    totalFuelCost: number;
    totalFuelQuantity: number;
    avgPricePerGallon: number;
    avgGalPerNm: number;
    avgCostPerNm: number;
    totalFlights: number;
    avgBurnVariance: number;
  }> {
    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - months);

    const { data, error } = await supabase
      .from('fuel_events')
      .select('*')
      .eq('aircraft_id', aircraftId)
      .gte('event_date', dateFrom.toISOString());

    if (error) {
      console.error('Aircraft fuel metrics error:', error);
      throw new Error(`Failed to fetch aircraft fuel metrics: ${error.message}`);
    }

    const events = data || [];
    const upliftEvents = events.filter(e => e.event_type === 'uplift');
    const burnEvents = events.filter(e => e.event_type === 'burn_actual');
    const plannedEvents = events.filter(e => e.event_type === 'burn_planned');

    // Calculate metrics
    const totalFuelCost = upliftEvents.reduce((sum, e) => sum + (e.total_cost || 0), 0);
    const totalFuelQuantity = upliftEvents.reduce((sum, e) => sum + e.fuel_quantity, 0);
    const avgPricePerGallon = upliftEvents.length > 0 
      ? upliftEvents.reduce((sum, e) => sum + (e.price_per_gallon || 0), 0) / upliftEvents.length 
      : 0;

    const validBurnEvents = burnEvents.filter(e => e.distance_nm && e.distance_nm > 0);
    const avgGalPerNm = validBurnEvents.length > 0
      ? validBurnEvents.reduce((sum, e) => sum + (e.fuel_quantity / (e.distance_nm || 1)), 0) / validBurnEvents.length
      : 0;

    const avgCostPerNm = validBurnEvents.length > 0 && avgPricePerGallon > 0
      ? avgGalPerNm * avgPricePerGallon
      : 0;

    // Calculate burn variance
    const flightIds = [...new Set(events.map(e => e.flight_id).filter(Boolean))];
    let totalVariance = 0;
    let varianceCount = 0;

    for (const flightId of flightIds) {
      const actualEvent = burnEvents.find(e => e.flight_id === flightId);
      const plannedEvent = plannedEvents.find(e => e.flight_id === flightId);
      
      if (actualEvent && plannedEvent && plannedEvent.fuel_quantity > 0) {
        const variance = ((actualEvent.fuel_quantity - plannedEvent.fuel_quantity) / plannedEvent.fuel_quantity) * 100;
        totalVariance += Math.abs(variance);
        varianceCount++;
      }
    }

    const avgBurnVariance = varianceCount > 0 ? totalVariance / varianceCount : 0;

    return {
      totalFuelCost,
      totalFuelQuantity,
      avgPricePerGallon,
      avgGalPerNm,
      avgCostPerNm,
      totalFlights: flightIds.length,
      avgBurnVariance
    };
  }

  // Get recent fuel price trends
  static async getFuelPriceTrends(months: number = 6): Promise<{
    date: string;
    avgPrice: number;
    totalQuantity: number;
    eventCount: number;
  }[]> {
    return Promise.race([
      this._getFuelPriceTrends(months),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Fuel price trends timeout')), this.TIMEOUT_MS)
      )
    ]);
  }

  private static async _getFuelPriceTrends(months: number = 6): Promise<{
    date: string;
    avgPrice: number;
    totalQuantity: number;
    eventCount: number;
  }[]> {
    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - months);

    const { data, error } = await supabase
      .from('fuel_events')
      .select('event_date, price_per_gallon, fuel_quantity')
      .eq('event_type', 'uplift')
      .gte('event_date', dateFrom.toISOString())
      .not('price_per_gallon', 'is', null)
      .order('event_date');

    if (error) {
      console.error('Fuel price trends error:', error);
      throw new Error(`Failed to fetch fuel price trends: ${error.message}`);
    }

    // Group by month
    const monthlyData: { [key: string]: { prices: number[]; quantities: number[]; count: number } } = {};
    
    (data || []).forEach(event => {
      const date = new Date(event.event_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { prices: [], quantities: [], count: 0 };
      }
      
      monthlyData[monthKey].prices.push(event.price_per_gallon);
      monthlyData[monthKey].quantities.push(event.fuel_quantity);
      monthlyData[monthKey].count++;
    });

    return Object.entries(monthlyData).map(([date, data]) => ({
      date,
      avgPrice: data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length,
      totalQuantity: data.quantities.reduce((sum, q) => sum + q, 0),
      eventCount: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));
  }
} 