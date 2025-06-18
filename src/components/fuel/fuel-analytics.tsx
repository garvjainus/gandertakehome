'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Gauge, 
  BarChart3,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { FuelEvent, Aircraft, FlightFuelSummary } from '@/types';

interface FuelAnalyticsProps {
  events: FuelEvent[];
  aircraft: Aircraft[];
  flightSummary: FlightFuelSummary[];
}

export function FuelAnalytics({ events, aircraft, flightSummary }: FuelAnalyticsProps) {
  // Calculate analytics data
  const analytics = useMemo(() => {
    const upliftEvents = events.filter(e => e.event_type === 'uplift');
    const burnEvents = events.filter(e => e.event_type === 'burn_actual');
    
    // Price trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentUpliftEvents = upliftEvents.filter(e => 
      new Date(e.event_date) >= sixMonthsAgo
    );

    // Group by month for price trends
    const monthlyPrices: { [key: string]: number[] } = {};
    recentUpliftEvents.forEach(event => {
      if (event.price_per_gallon) {
        const monthKey = new Date(event.event_date).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyPrices[monthKey]) {
          monthlyPrices[monthKey] = [];
        }
        monthlyPrices[monthKey].push(event.price_per_gallon);
      }
    });

    const priceTrends = Object.entries(monthlyPrices)
      .map(([month, prices]) => ({
        month,
        avgPrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
        eventCount: prices.length
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate current vs previous month price change
    const currentMonth = priceTrends[priceTrends.length - 1];
    const previousMonth = priceTrends[priceTrends.length - 2];
    const priceChange = currentMonth && previousMonth 
      ? ((currentMonth.avgPrice - previousMonth.avgPrice) / previousMonth.avgPrice) * 100
      : 0;

    // Efficiency analysis by aircraft
    const aircraftEfficiency = aircraft.map(ac => {
      const aircraftBurnEvents = burnEvents.filter(e => e.aircraft_id === ac.id);
      const validBurnEvents = aircraftBurnEvents.filter(e => e.distance_nm && e.distance_nm > 0);
      
      const totalFuelBurned = aircraftBurnEvents.reduce((sum, e) => sum + e.fuel_quantity, 0);
      const totalDistance = validBurnEvents.reduce((sum, e) => sum + (e.distance_nm || 0), 0);
      const avgEfficiency = totalDistance > 0 ? totalFuelBurned / totalDistance : 0;
      
      const aircraftUpliftEvents = upliftEvents.filter(e => e.aircraft_id === ac.id);
      const totalCost = aircraftUpliftEvents.reduce((sum, e) => sum + (e.total_cost || 0), 0);
      
      return {
        aircraft: ac,
        totalFuelBurned,
        totalDistance,
        avgEfficiency,
        totalCost,
        flightCount: aircraftBurnEvents.length
      };
    }).filter(ac => ac.flightCount > 0);

    // Variance analysis
    const highVarianceFlights = flightSummary.filter(f => 
      f.fuel_status === 'high_variance' && Math.abs(f.burn_variance_percent || 0) > 15
    );

    const avgVariance = flightSummary
      .filter(f => f.burn_variance_percent !== null)
      .reduce((sum, f) => sum + Math.abs(f.burn_variance_percent || 0), 0) / 
      flightSummary.filter(f => f.burn_variance_percent !== null).length || 0;

    // Cost per nautical mile trends
    const costPerNmData = flightSummary
      .filter(f => f.cost_per_nm && f.cost_per_nm > 0)
      .sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());

    return {
      priceTrends,
      priceChange,
      aircraftEfficiency,
      highVarianceFlights,
      avgVariance,
      costPerNmData,
      totalEvents: events.length,
      totalCost: upliftEvents.reduce((sum, e) => sum + (e.total_cost || 0), 0),
      totalFuelPurchased: upliftEvents.reduce((sum, e) => sum + e.fuel_quantity, 0),
      totalFuelBurned: burnEvents.reduce((sum, e) => sum + e.fuel_quantity, 0)
    };
  }, [events, aircraft, flightSummary]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Trend</CardTitle>
            {analytics.priceChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.priceChange > 0 ? '+' : ''}
              {analytics.priceChange.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Month-over-month change
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Variance</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.avgVariance.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Planned vs actual burn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Variance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.highVarianceFlights.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Flights with {'>'}15% variance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              Fuel events logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Price Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Fuel Price Trends (Last 6 Months)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.priceTrends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No price data available for trend analysis
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simple bar chart representation */}
              <div className="space-y-2">
                {analytics.priceTrends.map((trend, index) => {
                  const maxPrice = Math.max(...analytics.priceTrends.map(t => t.avgPrice));
                  const barWidth = (trend.avgPrice / maxPrice) * 100;
                  
                  return (
                    <div key={trend.month} className="flex items-center space-x-3">
                      <div className="w-16 text-sm text-muted-foreground">
                        {new Date(trend.month + '-01').toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: '2-digit' 
                        })}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div 
                          className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${barWidth}%` }}
                        >
                          <span className="text-white text-xs font-medium">
                            ${trend.avgPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="w-12 text-xs text-muted-foreground">
                        {trend.eventCount} events
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aircraft Efficiency Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gauge className="h-5 w-5" />
            <span>Aircraft Efficiency Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.aircraftEfficiency.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No efficiency data available
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.aircraftEfficiency
                .sort((a, b) => a.avgEfficiency - b.avgEfficiency)
                .map((ac, index) => {
                  const isEfficient = ac.avgEfficiency <= 
                    analytics.aircraftEfficiency.reduce((sum, a) => sum + a.avgEfficiency, 0) / 
                    analytics.aircraftEfficiency.length;
                  
                  return (
                    <div key={ac.aircraft.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {ac.aircraft.tail_number}
                          </span>
                          <span className="text-muted-foreground">
                            {ac.aircraft.model}
                          </span>
                          <Badge variant={isEfficient ? 'default' : 'secondary'}>
                            {isEfficient ? 'Efficient' : 'Above Average'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {ac.avgEfficiency.toFixed(2)} gal/nm
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Fuel Burned:</span>
                          <div className="font-medium">{ac.totalFuelBurned.toFixed(1)} gal</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Distance:</span>
                          <div className="font-medium">{ac.totalDistance.toFixed(1)} nm</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Cost:</span>
                          <div className="font-medium">${ac.totalCost.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Flights:</span>
                          <div className="font-medium">{ac.flightCount}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* High Variance Flights */}
      {analytics.highVarianceFlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                             <span>High Variance Flights ({'>'}15%)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.highVarianceFlights.slice(0, 10).map((flight) => (
                <div
                  key={flight.flight_id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{flight.tail_number}</span>
                      <span className="text-muted-foreground">
                        {flight.origin} → {flight.destination}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(flight.departure_time).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className="font-medium">
                        Planned: {flight.planned_burn_gal?.toFixed(1)} gal
                      </span>
                      <br />
                      <span className="font-medium">
                        Actual: {flight.actual_burn_gal?.toFixed(1)} gal
                      </span>
                    </div>
                    <div className="text-red-600 font-bold">
                      {flight.burn_variance_percent && flight.burn_variance_percent > 0 ? '+' : ''}
                      {flight.burn_variance_percent?.toFixed(1)}% variance
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost per Nautical Mile Trend */}
      {analytics.costPerNmData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Cost per Nautical Mile Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.costPerNmData.slice(-10).map((flight, index) => {
                const maxCost = Math.max(...analytics.costPerNmData.map(f => f.cost_per_nm || 0));
                const barWidth = ((flight.cost_per_nm || 0) / maxCost) * 100;
                
                return (
                  <div key={flight.flight_id} className="flex items-center space-x-3">
                    <div className="w-20 text-sm text-muted-foreground">
                      {new Date(flight.departure_time).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="w-16 text-sm font-medium">
                      {flight.tail_number}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div 
                        className="bg-green-500 h-4 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${barWidth}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          ${flight.cost_per_nm?.toFixed(2)}/nm
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 