'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Filter, 
  Search,  
  Trash2, 
  Fuel,  
  MapPin, 
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import { FuelService } from '@/services/fuel-service';
import { FuelEvent, Aircraft, Flight, FuelFilterOptions } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FuelEventsListProps {
  events: FuelEvent[];
  aircraft: Aircraft[];
  flights: Flight[];
  filters: FuelFilterOptions;
  onFiltersChange: (filters: FuelFilterOptions) => void;
  onEventDeleted: () => void;
}

export function FuelEventsList({
  events,
  aircraft,
  flights,
  filters,
  onFiltersChange,
  onEventDeleted
}: FuelEventsListProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this fuel event?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await FuelService.deleteFuelEvent(eventId);
      onEventDeleted();
    } catch (err) {
      console.error('Failed to delete fuel event:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete fuel event');
    } finally {
      setLoading(false);
    }
  };

  const getAircraftForEvent = (event: FuelEvent) => {
    return aircraft.find(a => a.id === event.aircraft_id);
  };

  const getFlightForEvent = (event: FuelEvent) => {
    return event.flight_id ? flights.find(f => f.id === event.flight_id) : null;
  };

  // Filter events based on search term
  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    
    const aircraft = getAircraftForEvent(event);
    const flight = getFlightForEvent(event);
    
    const searchLower = searchTerm.toLowerCase();
    return (
      aircraft?.tail_number.toLowerCase().includes(searchLower) ||
      aircraft?.model?.toLowerCase().includes(searchLower) ||
      event.location?.toLowerCase().includes(searchLower) ||
      event.supplier?.toLowerCase().includes(searchLower) ||
      event.notes?.toLowerCase().includes(searchLower) ||
      flight?.origin.toLowerCase().includes(searchLower) ||
      flight?.destination.toLowerCase().includes(searchLower)
    );
  });


  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'uplift':
        return 'bg-blue-100 text-blue-800';
      case 'burn_actual':
        return 'bg-green-100 text-green-800';
      case 'burn_planned':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'uplift':
        return 'Fuel Uplift';
      case 'burn_actual':
        return 'Actual Burn';
      case 'burn_planned':
        return 'Planned Burn';
      default:
        return eventType;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Aircraft Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Aircraft</label>
              <Select
                value={filters.aircraft_id || 'all'}
                onValueChange={(value) => 
                  onFiltersChange({ ...filters, aircraft_id: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All aircraft" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All aircraft</SelectItem>
                  {aircraft.map((aircraft) => (
                    <SelectItem key={aircraft.id} value={aircraft.id}>
                      {aircraft.tail_number} - {aircraft.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Select
                value={filters.event_type || 'all'}
                onValueChange={(value: 'uplift' | 'burn_actual' | 'burn_planned' | 'all') => 
                  onFiltersChange({ ...filters, event_type: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="uplift">Fuel Uplift</SelectItem>
                  <SelectItem value="burn_actual">Actual Burn</SelectItem>
                  <SelectItem value="burn_planned">Planned Burn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => 
                  onFiltersChange({ ...filters, date_from: e.target.value || undefined })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Fuel className="h-5 w-5" />
              <span>Fuel Events ({filteredEvents.length})</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {events.length === 0 ? 'No fuel events recorded yet' : 'No events match your filters'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const eventAircraft = getAircraftForEvent(event);
                const eventFlight = getFlightForEvent(event);
                
                return (
                  <div
                    key={event.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-center space-x-3">
                          <Badge className={getEventTypeColor(event.event_type)}>
                            {getEventTypeLabel(event.event_type)}
                          </Badge>
                          <span className="font-medium">
                            {eventAircraft?.tail_number} - {eventAircraft?.model}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.event_date).toLocaleDateString()} at{' '}
                            {new Date(event.event_date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {/* Flight Info */}
                        {eventFlight && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {eventFlight.origin} → {eventFlight.destination}
                            </span>
                          </div>
                        )}

                        {/* Event Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Fuel Quantity:</span>
                            <span className="ml-2">{event.fuel_quantity.toFixed(1)} gallons</span>
                          </div>

                          {event.event_type === 'uplift' && (
                            <>
                              <div>
                                <span className="font-medium">Price:</span>
                                <span className="ml-2">
                                  ${event.price_per_gallon?.toFixed(2)}/gal
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Total Cost:</span>
                                <span className="ml-2 text-green-600 font-medium">
                                  ${event.total_cost?.toFixed(2)}
                                </span>
                              </div>
                            </>
                          )}

                          {(event.event_type === 'burn_actual' || event.event_type === 'burn_planned') && (
                            <>
                              {event.distance_nm && (
                                <div>
                                  <span className="font-medium">Distance:</span>
                                  <span className="ml-2">{event.distance_nm.toFixed(1)} nm</span>
                                </div>
                              )}
                              {event.flight_time_hours && (
                                <div>
                                  <span className="font-medium">Flight Time:</span>
                                  <span className="ml-2">{event.flight_time_hours.toFixed(1)} hrs</span>
                                </div>
                              )}
                              {event.distance_nm && event.distance_nm > 0 && (
                                <div>
                                  <span className="font-medium">Efficiency:</span>
                                  <span className="ml-2">
                                    {(event.fuel_quantity / event.distance_nm).toFixed(2)} gal/nm
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Location & Supplier */}
                        {(event.location || event.supplier) && (
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            {event.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.supplier && (
                              <div className="flex items-center space-x-1">
                                <Fuel className="h-3 w-3" />
                                <span>{event.supplier}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {event.notes && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Notes:</span>
                            <span className="ml-2">{event.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 