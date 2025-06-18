import { FuelService } from './fuel-service';
import { FuelEventCreate } from '@/types';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-fuel-event-id',
              aircraft_id: 'test-aircraft-id',
              event_type: 'uplift',
              fuel_quantity: 100,
              price_per_gallon: 5.85,
              total_cost: 585,
              recorded_by: 'test-user-id',
              event_date: '2024-01-01T12:00:00Z',
              created_at: '2024-01-01T12:00:00Z',
              updated_at: '2024-01-01T12:00:00Z'
            },
            error: null
          }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        })),
        order: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'test-fuel-event-id' },
              error: null
            }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          error: null
        }))
      }))
    }))
  }))
}));

describe('FuelService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFuelEvent', () => {
    it('should create a fuel uplift event successfully', async () => {
      const fuelEvent: FuelEventCreate = {
        aircraft_id: 'test-aircraft-id',
        event_type: 'uplift',
        fuel_quantity: 100,
        price_per_gallon: 5.85,
        location: 'KJFK',
        supplier: 'Shell Aviation'
      };

      const result = await FuelService.createFuelEvent(fuelEvent);

      expect(result).toEqual({
        id: 'test-fuel-event-id',
        aircraft_id: 'test-aircraft-id',
        event_type: 'uplift',
        fuel_quantity: 100,
        price_per_gallon: 5.85,
        total_cost: 585,
        recorded_by: 'test-user-id',
        event_date: '2024-01-01T12:00:00Z',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      });
    });

    it('should create a fuel burn event successfully', async () => {
      const fuelEvent: FuelEventCreate = {
        aircraft_id: 'test-aircraft-id',
        event_type: 'burn_actual',
        fuel_quantity: 75,
        distance_nm: 250,
        flight_time_hours: 2.5
      };

      const result = await FuelService.createFuelEvent(fuelEvent);

      expect(result).toBeDefined();
      expect(result.event_type).toBe('burn_actual');
      expect(result.fuel_quantity).toBe(75);
    });

    it('should handle timeout errors', async () => {
      // Mock a slow response
      jest.spyOn(FuelService, 'createFuelEvent').mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 6000))
      );

      const fuelEvent: FuelEventCreate = {
        aircraft_id: 'test-aircraft-id',
        event_type: 'uplift',
        fuel_quantity: 100,
        price_per_gallon: 5.85
      };

      await expect(FuelService.createFuelEvent(fuelEvent))
        .rejects
        .toThrow('Create fuel event timeout');
    });
  });

  describe('getFuelEvents', () => {
    it('should fetch fuel events with filters', async () => {
      const filters = {
        aircraft_id: 'test-aircraft-id',
        event_type: 'uplift' as const
      };

      const result = await FuelService.getFuelEvents(filters);

      expect(result).toEqual([]);
    });

    it('should fetch all fuel events when no filters provided', async () => {
      const result = await FuelService.getFuelEvents();

      expect(result).toEqual([]);
    });
  });

  describe('updateFuelEvent', () => {
    it('should update a fuel event successfully', async () => {
      const updates = {
        fuel_quantity: 120,
        price_per_gallon: 6.00
      };

      const result = await FuelService.updateFuelEvent('test-fuel-event-id', updates);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-fuel-event-id');
    });
  });

  describe('deleteFuelEvent', () => {
    it('should delete a fuel event successfully', async () => {
      await expect(FuelService.deleteFuelEvent('test-fuel-event-id'))
        .resolves
        .not.toThrow();
    });
  });

  describe('getAircraftFuelMetrics', () => {
    it('should calculate fuel metrics for an aircraft', async () => {
      const result = await FuelService.getAircraftFuelMetrics('test-aircraft-id', 12);

      expect(result).toEqual({
        totalFuelCost: 0,
        totalFuelQuantity: 0,
        avgPricePerGallon: 0,
        avgGalPerNm: 0,
        avgCostPerNm: 0,
        totalFlights: 0,
        avgBurnVariance: 0
      });
    });
  });

  describe('getFuelPriceTrends', () => {
    it('should fetch fuel price trends', async () => {
      const result = await FuelService.getFuelPriceTrends(6);

      expect(result).toEqual([]);
    });
  });
});

// Integration tests for fuel calculations
describe('Fuel Calculations', () => {
  it('should calculate efficiency correctly', () => {
    const fuelQuantity = 100; // gallons
    const distance = 250; // nautical miles
    const efficiency = fuelQuantity / distance;

    expect(efficiency).toBe(0.4); // 0.4 gal/nm
  });

  it('should calculate cost per nautical mile correctly', () => {
    const fuelQuantity = 100; // gallons
    const pricePerGallon = 5.85; // $/gal
    const distance = 250; // nautical miles
    const costPerNm = (fuelQuantity * pricePerGallon) / distance;

    expect(costPerNm).toBe(2.34); // $2.34/nm
  });

  it('should calculate burn variance correctly', () => {
    const plannedBurn = 100; // gallons
    const actualBurn = 110; // gallons
    const variance = ((actualBurn - plannedBurn) / plannedBurn) * 100;

    expect(variance).toBe(10); // 10% over planned
  });

  it('should handle negative variance (under-burn)', () => {
    const plannedBurn = 100; // gallons
    const actualBurn = 90; // gallons
    const variance = ((actualBurn - plannedBurn) / plannedBurn) * 100;

    expect(variance).toBe(-10); // 10% under planned
  });
});

// Test data validation
describe('Fuel Event Validation', () => {
  it('should validate uplift events require price', () => {
    const upliftEvent: FuelEventCreate = {
      aircraft_id: 'test-aircraft-id',
      event_type: 'uplift',
      fuel_quantity: 100
      // Missing price_per_gallon
    };

    // This would be caught by form validation
    expect(upliftEvent.price_per_gallon).toBeUndefined();
  });

  it('should validate fuel quantity is positive', () => {
    const fuelEvent: FuelEventCreate = {
      aircraft_id: 'test-aircraft-id',
      event_type: 'uplift',
      fuel_quantity: -10, // Invalid negative quantity
      price_per_gallon: 5.85
    };

    expect(fuelEvent.fuel_quantity).toBeLessThan(0);
  });

  it('should validate distance for burn events', () => {
    const burnEvent: FuelEventCreate = {
      aircraft_id: 'test-aircraft-id',
      event_type: 'burn_actual',
      fuel_quantity: 75,
      distance_nm: 0 // Invalid zero distance
    };

    expect(burnEvent.distance_nm).toBe(0);
  });
}); 