'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fuel, Calculator, AlertTriangle, Loader2 } from 'lucide-react';
import { FuelService } from '@/services/fuel-service';
import { Aircraft, Flight, FuelEventCreate } from '@/types';

interface FuelEventFormProps {
  aircraft: Aircraft[];
  flights: Flight[];
  onClose: () => void;
  onEventCreated: () => void;
  initialData?: Partial<FuelEventCreate>;
}

export function FuelEventForm({ 
  aircraft, 
  flights, 
  onClose, 
  onEventCreated, 
  initialData 
}: FuelEventFormProps) {
  const [formData, setFormData] = useState<FuelEventCreate>({
    aircraft_id: '',
    event_type: 'uplift',
    fuel_quantity: 0,
    ...initialData
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Auto-calculate total cost when price or quantity changes
  useEffect(() => {
    if (formData.event_type === 'uplift' && formData.price_per_gallon && formData.fuel_quantity) {
      const totalCost = formData.price_per_gallon * formData.fuel_quantity;
      // Don't update if the calculated value is the same to avoid infinite loops
      if (Math.abs(totalCost - (formData.total_cost || 0)) > 0.01) {
        setFormData(prev => ({ ...prev, total_cost: totalCost }));
      }
    }
  }, [formData.price_per_gallon, formData.fuel_quantity, formData.event_type]);

  // Scroll to top when error changes
  useEffect(() => {
    if (error && modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  const handleInputChange = (field: keyof FuelEventCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.aircraft_id) {
      errors.aircraft_id = 'Aircraft is required';
    }

    if (!formData.fuel_quantity || formData.fuel_quantity <= 0) {
      errors.fuel_quantity = 'Fuel quantity must be greater than 0';
    }

    if (formData.event_type === 'uplift') {
      if (!formData.price_per_gallon || formData.price_per_gallon <= 0) {
        errors.price_per_gallon = 'Price per gallon is required for uplift events';
      }
    }

    if (formData.event_type === 'burn_actual' || formData.event_type === 'burn_planned') {
      if (formData.distance_nm && formData.distance_nm <= 0) {
        errors.distance_nm = 'Distance must be greater than 0';
      }
      if (formData.flight_time_hours && formData.flight_time_hours <= 0) {
        errors.flight_time_hours = 'Flight time must be greater than 0';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Clean up the data before submission
      const cleanData: FuelEventCreate = {
        ...formData,
        fuel_quantity: Number(formData.fuel_quantity),
        price_per_gallon: formData.price_per_gallon ? Number(formData.price_per_gallon) : undefined,
        distance_nm: formData.distance_nm ? Number(formData.distance_nm) : undefined,
        flight_time_hours: formData.flight_time_hours ? Number(formData.flight_time_hours) : undefined,
        event_date: formData.event_date || new Date().toISOString(),
      };

      await FuelService.createFuelEvent(cleanData);
      onEventCreated();
    } catch (err) {
      console.error('Failed to create fuel event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create fuel event');
    } finally {
      setLoading(false);
    }
  };

  const selectedAircraft = aircraft.find(a => a.id === formData.aircraft_id);
  const availableFlights = flights.filter(f => 
    f.aircraft_id === formData.aircraft_id && 
    f.status !== 'cancelled'
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent 
        ref={modalContentRef}
        className="max-w-4xl sm:max-w-4xl lg:max-w-4xl max-h-[95vh] overflow-y-auto p-8"
      >
        <DialogHeader className="space-y-4 pb-6 border-b">
          <DialogTitle className="flex items-center text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <Fuel className="h-8 w-8 mr-3 text-blue-600" />
            Log Fuel Event
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600">
            Record fuel uplift or burn data for accurate tracking and analysis
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 mt-8">
          {/* Basic Information */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="flex items-center text-xl font-semibold">
                <Fuel className="h-6 w-6 mr-3 text-blue-600" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-base">
                Select aircraft and specify event details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="aircraft_id" className="flex items-center text-base font-medium">
                    Aircraft *
                  </Label>
                  <Select
                    value={formData.aircraft_id}
                    onValueChange={(value) => handleInputChange('aircraft_id', value)}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select aircraft" />
                    </SelectTrigger>
                    <SelectContent>
                      {aircraft.map((aircraft) => (
                        <SelectItem key={aircraft.id} value={aircraft.id} className="py-3">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-base">{aircraft.tail_number}</span>
                            {aircraft.model && (
                              <span className="text-sm text-gray-500 ml-3">{aircraft.model}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.aircraft_id && (
                    <p className="text-sm text-red-600">{validationErrors.aircraft_id}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="event_type" className="flex items-center text-base font-medium">
                    Event Type *
                  </Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value: 'uplift' | 'burn_actual' | 'burn_planned') => 
                      handleInputChange('event_type', value)
                    }
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uplift" className="py-3">Fuel Uplift</SelectItem>
                      <SelectItem value="burn_actual" className="py-3">Actual Burn</SelectItem>
                      <SelectItem value="burn_planned" className="py-3">Planned Burn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Flight Selection (optional) */}
              {availableFlights.length > 0 && (
                <div className="space-y-3">
                  <Label htmlFor="flight_id" className="flex items-center text-base font-medium">
                    Associated Flight (Optional)
                  </Label>
                  <Select
                    value={formData.flight_id || 'none'}
                    onValueChange={(value) => handleInputChange('flight_id', value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select flight (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="py-3">No associated flight</SelectItem>
                      {availableFlights.map((flight) => (
                        <SelectItem key={flight.id} value={flight.id} className="py-3">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{flight.origin} → {flight.destination}</span>
                            <span className="text-sm text-gray-500 ml-3">
                              {new Date(flight.departure_time).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Fuel Quantity */}
              <div className="space-y-3">
                <Label htmlFor="fuel_quantity" className="flex items-center text-base font-medium">
                  Fuel Quantity (gallons) *
                </Label>
                <Input
                  id="fuel_quantity"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.fuel_quantity || ''}
                  onChange={(e) => handleInputChange('fuel_quantity', parseFloat(e.target.value) || 0)}
                  placeholder="Enter fuel quantity"
                  className="h-12 text-base"
                />
                {validationErrors.fuel_quantity && (
                  <p className="text-sm text-red-600">{validationErrors.fuel_quantity}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Uplift-specific fields */}
          {formData.event_type === 'uplift' && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="space-y-3 pb-6">
                <CardTitle className="flex items-center text-xl font-semibold">
                  <Fuel className="h-6 w-6 mr-3 text-blue-600" />
                  Fuel Uplift Details
                </CardTitle>
                <CardDescription className="text-base">
                  Enter details for the fuel uplift event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="price_per_gallon" className="flex items-center text-base font-medium">
                      Price per Gallon ($) *
                    </Label>
                    <Input
                      id="price_per_gallon"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price_per_gallon || ''}
                      onChange={(e) => handleInputChange('price_per_gallon', parseFloat(e.target.value) || undefined)}
                      placeholder="e.g., 5.85"
                      className="h-12 text-base"
                    />
                    {validationErrors.price_per_gallon && (
                      <p className="text-sm text-red-600">{validationErrors.price_per_gallon}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="total_cost" className="flex items-center text-base font-medium">
                      Total Cost ($)
                    </Label>
                    <div className="relative">
                      <Input
                        id="total_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.total_cost?.toFixed(2) || ''}
                        onChange={(e) => handleInputChange('total_cost', parseFloat(e.target.value) || undefined)}
                        placeholder="Auto-calculated"
                        className="h-12 text-base"
                      />
                      <Calculator className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Auto-calculated from quantity × price
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="location" className="flex items-center text-base font-medium">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value || undefined)}
                    placeholder="e.g., KJFK, Shell Station"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="supplier" className="flex items-center text-base font-medium">
                    Fuel Supplier
                  </Label>
                  <Input
                    id="supplier"
                    value={formData.supplier || ''}
                    onChange={(e) => handleInputChange('supplier', e.target.value || undefined)}
                    placeholder="e.g., Shell Aviation, BP"
                    className="h-12 text-base"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Burn-specific fields */}
          {(formData.event_type === 'burn_actual' || formData.event_type === 'burn_planned') && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-lime-50">
              <CardHeader className="space-y-3 pb-6">
                <CardTitle className="flex items-center text-xl font-semibold">
                  <Fuel className="h-6 w-6 mr-3 text-green-600" />
                  Flight Performance Data
                </CardTitle>
                <CardDescription className="text-base">
                  Enter flight performance data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="distance_nm" className="flex items-center text-base font-medium">
                      Distance (nautical miles)
                    </Label>
                    <Input
                      id="distance_nm"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.distance_nm || ''}
                      onChange={(e) => handleInputChange('distance_nm', parseFloat(e.target.value) || undefined)}
                      placeholder="e.g., 250.5"
                      className="h-12 text-base"
                    />
                    {validationErrors.distance_nm && (
                      <p className="text-sm text-red-600">{validationErrors.distance_nm}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="flight_time_hours" className="flex items-center text-base font-medium">
                      Flight Time (hours)
                    </Label>
                    <Input
                      id="flight_time_hours"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.flight_time_hours || ''}
                      onChange={(e) => handleInputChange('flight_time_hours', parseFloat(e.target.value) || undefined)}
                      placeholder="e.g., 2.5"
                      className="h-12 text-base"
                    />
                    {validationErrors.flight_time_hours && (
                      <p className="text-sm text-red-600">{validationErrors.flight_time_hours}</p>
                    )}
                  </div>
                </div>

                {/* Efficiency calculations */}
                {formData.fuel_quantity > 0 && formData.distance_nm && formData.distance_nm > 0 && (
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm font-medium mb-2">Calculated Efficiency:</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Fuel per NM:</span>
                        <span className="ml-2 font-medium">
                          {(formData.fuel_quantity / formData.distance_nm).toFixed(2)} gal/nm
                        </span>
                      </div>
                      {formData.flight_time_hours && formData.flight_time_hours > 0 && (
                        <div>
                          <span className="text-muted-foreground">Fuel per Hour:</span>
                          <span className="ml-2 font-medium">
                            {(formData.fuel_quantity / formData.flight_time_hours).toFixed(2)} gal/hr
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Event Date */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="flex items-center text-xl font-semibold">
                <Fuel className="h-6 w-6 mr-3 text-gray-600" />
                Event Date
              </CardTitle>
              <CardDescription className="text-base">
                Select the date and time of the fuel event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="event_date" className="flex items-center text-base font-medium">
                  Event Date
                </Label>
                <Input
                  id="event_date"
                  type="datetime-local"
                  value={formData.event_date ? new Date(formData.event_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('event_date', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="h-12 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to use current date/time
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="flex items-center text-xl font-semibold">
                <Fuel className="h-6 w-6 mr-3 text-gray-600" />
                Notes
              </CardTitle>
              <CardDescription className="text-base">
                Add any additional notes about this fuel event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="notes" className="flex items-center text-base font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value || undefined)}
                  placeholder="Additional notes about this fuel event..."
                  rows={3}
                  className="h-24 text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Fuel className="h-4 w-4" />
                  <span>Create Fuel Event</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 