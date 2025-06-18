'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Fuel, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Gauge, 
  AlertTriangle,
  BarChart3,
  Filter,
  Download
} from 'lucide-react';
import { FuelService } from '@/services/fuel-service';
import { 
  FuelEvent, 
  FuelEfficiencySummary, 
  FlightFuelSummary, 
  Aircraft, 
  Flight,
  FuelFilterOptions 
} from '@/types';
import { FuelEventForm } from './fuel/fuel-event-form';
import { FuelEventsList } from './fuel/fuel-events-list';
import { FuelAnalytics } from './fuel/fuel-analytics';
import { FuelEfficiencyDashboard } from './fuel/fuel-efficiency-dashboard';

interface FuelTrackerProps {
  aircraft: Aircraft[];
  flights: Flight[];
}

export function FuelTracker({ aircraft, flights }: FuelTrackerProps) {
  const [activeTab, setActiveTab] = useState('events');
  const [fuelEvents, setFuelEvents] = useState<FuelEvent[]>([]);
  const [efficiencySummary, setEfficiencySummary] = useState<FuelEfficiencySummary[]>([]);
  const [flightSummary, setFlightSummary] = useState<FlightFuelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [filters, setFilters] = useState<FuelFilterOptions>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load fuel data
  useEffect(() => {
    loadFuelData();
  }, [refreshTrigger, filters]);

  const loadFuelData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [events, efficiency, flightData] = await Promise.all([
        FuelService.getFuelEvents(filters),
        FuelService.getFuelEfficiencySummary(),
        FuelService.getFlightFuelSummary({ limit: 50 })
      ]);

      setFuelEvents(events);
      setEfficiencySummary(efficiency);
      setFlightSummary(flightData);
    } catch (err) {
      console.error('Failed to load fuel data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load fuel data');
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = () => {
    setShowEventForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEventUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEventDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Calculate summary stats
  const summaryStats = React.useMemo(() => {
    const upliftEvents = fuelEvents.filter(e => e.event_type === 'uplift');
    const totalCost = upliftEvents.reduce((sum, e) => sum + (e.total_cost || 0), 0);
    const totalQuantity = upliftEvents.reduce((sum, e) => sum + e.fuel_quantity, 0);
    const avgPrice = upliftEvents.length > 0 
      ? upliftEvents.reduce((sum, e) => sum + (e.price_per_gallon || 0), 0) / upliftEvents.length 
      : 0;

    const burnEvents = fuelEvents.filter(e => e.event_type === 'burn_actual');
    const validBurnEvents = burnEvents.filter(e => e.distance_nm && e.distance_nm > 0);
    const avgEfficiency = validBurnEvents.length > 0
      ? validBurnEvents.reduce((sum, e) => sum + (e.fuel_quantity / (e.distance_nm || 1)), 0) / validBurnEvents.length
      : 0;

    // Calculate variance alerts
    const highVarianceFlights = flightSummary.filter(f => 
      f.fuel_status === 'high_variance' && Math.abs(f.burn_variance_percent || 0) > 15
    ).length;

    return {
      totalCost,
      totalQuantity,
      avgPrice,
      avgEfficiency,
      totalEvents: fuelEvents.length,
      highVarianceFlights
    };
  }, [fuelEvents, flightSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Fuel className="h-6 w-6 animate-spin" />
          <span>Loading fuel data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Fuel className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Fuel Burn & Cost Tracker</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowEventForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Log Fuel Event</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryStats.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.totalQuantity.toFixed(1)} gallons purchased
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fuel Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryStats.avgPrice.toFixed(2)}/gal
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Efficiency</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.avgEfficiency.toFixed(2)} gal/nm
            </div>
            <p className="text-xs text-muted-foreground">
              Average consumption rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.highVarianceFlights}
            </div>
            <p className="text-xs text-muted-foreground">
              High variance flights ({'>'}15%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events" className="flex items-center space-x-2">
            <Fuel className="h-4 w-4" />
            <span>Fuel Events</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="flex items-center space-x-2">
            <Gauge className="h-4 w-4" />
            <span>Efficiency</span>
          </TabsTrigger>
          <TabsTrigger value="flights" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Flight Summary</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <FuelEventsList
            events={fuelEvents}
            aircraft={aircraft}
            flights={flights}
            filters={filters}
            onFiltersChange={setFilters}
            onEventUpdated={handleEventUpdated}
            onEventDeleted={handleEventDeleted}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <FuelAnalytics
            events={fuelEvents}
            aircraft={aircraft}
            flightSummary={flightSummary}
          />
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <FuelEfficiencyDashboard
            efficiencySummary={efficiencySummary}
            aircraft={aircraft}
          />
        </TabsContent>

        <TabsContent value="flights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Flight Fuel Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flightSummary.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No flight fuel data available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {flightSummary.slice(0, 10).map((flight) => (
                      <div
                        key={flight.flight_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {flight.tail_number}
                            </span>
                            <span className="text-muted-foreground">
                              {flight.origin} → {flight.destination}
                            </span>
                            <Badge
                              variant={
                                flight.fuel_status === 'high_variance'
                                  ? 'destructive'
                                  : flight.fuel_status === 'missing_actual' ||
                                    flight.fuel_status === 'missing_planned'
                                  ? 'secondary'
                                  : 'default'
                              }
                            >
                              {flight.fuel_status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(flight.departure_time).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          {flight.actual_burn_gal && (
                            <div className="text-sm">
                              <span className="font-medium">
                                {flight.actual_burn_gal.toFixed(1)} gal
                              </span>
                              {flight.actual_gal_per_nm && (
                                <span className="text-muted-foreground ml-2">
                                  ({flight.actual_gal_per_nm.toFixed(2)} gal/nm)
                                </span>
                              )}
                            </div>
                          )}
                          {flight.burn_variance_percent !== null && (
                            <div className="text-xs">
                              <span
                                className={
                                  Math.abs(flight.burn_variance_percent) > 15
                                    ? 'text-red-600'
                                    : Math.abs(flight.burn_variance_percent) > 5
                                    ? 'text-yellow-600'
                                    : 'text-green-600'
                                }
                              >
                                {flight.burn_variance_percent > 0 ? '+' : ''}
                                {flight.burn_variance_percent.toFixed(1)}% variance
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fuel Event Form Modal */}
      {showEventForm && (
        <FuelEventForm
          aircraft={aircraft}
          flights={flights}
          onClose={() => setShowEventForm(false)}
          onEventCreated={handleEventCreated}
        />
      )}
    </div>
  );
} 