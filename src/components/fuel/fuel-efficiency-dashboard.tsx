'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Fuel,
  Calendar,
  Target
} from 'lucide-react';
import { FuelEfficiencySummary, Aircraft } from '@/types';

interface FuelEfficiencyDashboardProps {
  efficiencySummary: FuelEfficiencySummary[];
  aircraft: Aircraft[];
}

export function FuelEfficiencyDashboard({ 
  efficiencySummary, 
  aircraft 
}: FuelEfficiencyDashboardProps) {
  // Calculate fleet averages
  const fleetAverages = React.useMemo(() => {
    if (efficiencySummary.length === 0) {
      return {
        avgGalPerNm: 0,
        avgGalPerHour: 0,
        avgCostPerNm: 0,
        avgPricePerGallon: 0,
        avgBurnVariance: 0,
        totalCost: 0,
        totalFuelPurchased: 0
      };
    }

    const validEfficiencyData = efficiencySummary.filter(s => s.avg_gal_per_nm > 0);
    const validCostData = efficiencySummary.filter(s => s.avg_cost_per_nm > 0);
    const validVarianceData = efficiencySummary.filter(s => s.avg_burn_variance_percent !== null);

    return {
      avgGalPerNm: validEfficiencyData.length > 0 
        ? validEfficiencyData.reduce((sum, s) => sum + s.avg_gal_per_nm, 0) / validEfficiencyData.length 
        : 0,
      avgGalPerHour: efficiencySummary.reduce((sum, s) => sum + (s.avg_gal_per_hour || 0), 0) / efficiencySummary.length,
      avgCostPerNm: validCostData.length > 0 
        ? validCostData.reduce((sum, s) => sum + s.avg_cost_per_nm, 0) / validCostData.length 
        : 0,
      avgPricePerGallon: efficiencySummary.reduce((sum, s) => sum + (s.avg_price_per_gallon || 0), 0) / efficiencySummary.length,
      avgBurnVariance: validVarianceData.length > 0 
        ? validVarianceData.reduce((sum, s) => sum + Math.abs(s.avg_burn_variance_percent), 0) / validVarianceData.length 
        : 0,
      totalCost: efficiencySummary.reduce((sum, s) => sum + (s.total_fuel_cost || 0), 0),
      totalFuelPurchased: efficiencySummary.reduce((sum, s) => sum + (s.total_fuel_purchased_gal || 0), 0)
    };
  }, [efficiencySummary]);

  // Rank aircraft by efficiency
  const rankedAircraft = React.useMemo(() => {
    return efficiencySummary
      .filter(s => s.avg_gal_per_nm > 0)
      .sort((a, b) => a.avg_gal_per_nm - b.avg_gal_per_nm)
      .map((summary, index) => ({
        ...summary,
        rank: index + 1,
        isEfficient: summary.avg_gal_per_nm <= fleetAverages.avgGalPerNm,
        efficiencyScore: fleetAverages.avgGalPerNm > 0 
          ? Math.max(0, 100 - ((summary.avg_gal_per_nm / fleetAverages.avgGalPerNm - 1) * 100))
          : 100
      }));
  }, [efficiencySummary, fleetAverages.avgGalPerNm]);

  const getEfficiencyBadge = (aircraft: typeof rankedAircraft[0]) => {
    if (aircraft.efficiencyScore >= 110) {
      return { variant: 'default' as const, label: 'Excellent', color: 'text-green-600' };
    } else if (aircraft.efficiencyScore >= 100) {
      return { variant: 'default' as const, label: 'Good', color: 'text-blue-600' };
    } else if (aircraft.efficiencyScore >= 90) {
      return { variant: 'secondary' as const, label: 'Average', color: 'text-yellow-600' };
    } else {
      return { variant: 'destructive' as const, label: 'Below Average', color: 'text-red-600' };
    }
  };

  const getVarianceBadge = (variance: number) => {
    if (variance <= 5) {
      return { variant: 'default' as const, label: 'Excellent', color: 'text-green-600' };
    } else if (variance <= 10) {
      return { variant: 'secondary' as const, label: 'Good', color: 'text-blue-600' };
    } else if (variance <= 15) {
      return { variant: 'secondary' as const, label: 'Fair', color: 'text-yellow-600' };
    } else {
      return { variant: 'destructive' as const, label: 'Poor', color: 'text-red-600' };
    }
  };

  if (efficiencySummary.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No efficiency data available yet.</p>
        <p className="text-sm">Start logging fuel events to see efficiency metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Avg Efficiency</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fleetAverages.avgGalPerNm.toFixed(2)} gal/nm
            </div>
            <p className="text-xs text-muted-foreground">
              {fleetAverages.avgGalPerHour.toFixed(1)} gal/hr average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Avg Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${fleetAverages.avgCostPerNm.toFixed(2)}/nm
            </div>
            <p className="text-xs text-muted-foreground">
              ${fleetAverages.avgPricePerGallon.toFixed(2)}/gal average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Variance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fleetAverages.avgBurnVariance.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average burn variance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Cost</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${fleetAverages.totalCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {fleetAverages.totalFuelPurchased.toFixed(0)} gallons purchased
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aircraft Efficiency Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gauge className="h-5 w-5" />
            <span>Aircraft Efficiency Ranking</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rankedAircraft.map((aircraft) => {
              const efficiencyBadge = getEfficiencyBadge(aircraft);
              const varianceBadge = getVarianceBadge(Math.abs(aircraft.avg_burn_variance_percent));
              
              return (
                <div key={aircraft.aircraft_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold text-sm">
                        #{aircraft.rank}
                      </div>
                      <div>
                        <div className="font-medium text-lg">
                          {aircraft.tail_number}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {aircraft.model}
                        </div>
                      </div>
                      <Badge variant={efficiencyBadge.variant}>
                        {efficiencyBadge.label}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {aircraft.avg_gal_per_nm.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        gal/nm
                      </div>
                    </div>
                  </div>

                  {/* Efficiency Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Efficiency Score</span>
                      <span className={efficiencyBadge.color}>
                        {aircraft.efficiencyScore.toFixed(0)}%
                      </span>
                    </div>
                                       <div className="w-full bg-gray-200 rounded-full h-2">
                     <div 
                       className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                       style={{ width: `${Math.min(aircraft.efficiencyScore, 100)}%` }}
                     />
                   </div>
                  </div>

                  {/* Detailed Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Fuel per Hour</div>
                      <div className="font-medium">
                        {aircraft.avg_gal_per_hour?.toFixed(1) || 'N/A'} gal/hr
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Cost per NM</div>
                      <div className="font-medium">
                        ${aircraft.avg_cost_per_nm?.toFixed(2) || 'N/A'}/nm
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Burn Variance</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {Math.abs(aircraft.avg_burn_variance_percent).toFixed(1)}%
                        </span>
                        <Badge variant={varianceBadge.variant} className="text-xs">
                          {varianceBadge.label}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Flights</div>
                      <div className="font-medium">
                        {aircraft.actual_burn_events} flights
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total Fuel Cost</div>
                        <div className="font-medium text-green-600">
                          ${aircraft.total_fuel_cost?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Fuel Purchased</div>
                        <div className="font-medium">
                          {aircraft.total_fuel_purchased_gal?.toFixed(0) || '0'} gal
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Price</div>
                        <div className="font-medium">
                          ${aircraft.avg_price_per_gallon?.toFixed(2) || '0.00'}/gal
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Period */}
                  <div className="mt-2 text-xs text-muted-foreground flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Data from {new Date(aircraft.first_event_date).toLocaleDateString()} to{' '}
                      {new Date(aircraft.last_event_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Efficiency Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Efficiency Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Most Efficient Aircraft */}
            {rankedAircraft.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Most Efficient Aircraft</span>
                </div>
                <p className="text-sm text-green-700">
                  <strong>{rankedAircraft[0].tail_number}</strong> leads the fleet with{' '}
                  <strong>{rankedAircraft[0].avg_gal_per_nm.toFixed(2)} gal/nm</strong>, which is{' '}
                  <strong>
                    {((fleetAverages.avgGalPerNm - rankedAircraft[0].avg_gal_per_nm) / fleetAverages.avgGalPerNm * 100).toFixed(1)}%
                  </strong>{' '}
                  better than fleet average.
                </p>
              </div>
            )}

            {/* Least Efficient Aircraft */}
            {rankedAircraft.length > 1 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Needs Attention</span>
                </div>
                <p className="text-sm text-red-700">
                  <strong>{rankedAircraft[rankedAircraft.length - 1].tail_number}</strong> has the highest consumption at{' '}
                  <strong>{rankedAircraft[rankedAircraft.length - 1].avg_gal_per_nm.toFixed(2)} gal/nm</strong>, which is{' '}
                  <strong>
                    {((rankedAircraft[rankedAircraft.length - 1].avg_gal_per_nm - fleetAverages.avgGalPerNm) / fleetAverages.avgGalPerNm * 100).toFixed(1)}%
                  </strong>{' '}
                  above fleet average.
                </p>
              </div>
            )}

            {/* High Variance Alert */}
            {rankedAircraft.some(a => Math.abs(a.avg_burn_variance_percent) > 15) && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">High Variance Alert</span>
                </div>
                <p className="text-sm text-yellow-700">
                  {rankedAircraft.filter(a => Math.abs(a.avg_burn_variance_percent) > 15).length} aircraft 
                  have burn variance {'>'}15%. Consider reviewing flight planning accuracy.
                </p>
              </div>
            )}

            {/* Cost Savings Opportunity */}
            {rankedAircraft.length > 1 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Cost Savings Opportunity</span>
                </div>
                <p className="text-sm text-blue-700">
                  If all aircraft matched the efficiency of <strong>{rankedAircraft[0].tail_number}</strong>, 
                  the fleet could save approximately{' '}
                  <strong>
                    ${((fleetAverages.avgGalPerNm - rankedAircraft[0].avg_gal_per_nm) * 
                       fleetAverages.avgPricePerGallon * 1000).toFixed(0)}
                  </strong>{' '}
                  per 1,000 nautical miles flown.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 