'use client'

import { useState, useRef, useEffect } from 'react'
import { Aircraft, NewFlight, PilotProfile } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Plane, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Users,
  FileText, 
  AlertCircle, 
  Loader2 
} from 'lucide-react'

interface AddFlightModalProps {
  aircraft: Aircraft[]
  pilots: PilotProfile[]
  onClose: () => void
  onSubmit: (flight: NewFlight) => Promise<void>
  prefilledData?: Partial<NewFlight> | null
}

export function AddFlightModal({ aircraft, pilots, onClose, onSubmit, prefilledData }: AddFlightModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  
  const [formData, setFormData] = useState<NewFlight>(() => ({
    aircraft_id: prefilledData?.aircraft_id || '',
    captain_id: prefilledData?.captain_id || '',
    first_officer_id: prefilledData?.first_officer_id || '',
    departure_time: prefilledData?.departure_time || '',
    arrival_time: prefilledData?.arrival_time || '',
    origin: prefilledData?.origin || '',
    destination: prefilledData?.destination || '',
    flight_type: prefilledData?.flight_type || 'charter',
    passenger_count: prefilledData?.passenger_count || 0,
    notes: prefilledData?.notes || '',
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.aircraft_id || !formData.departure_time || !formData.arrival_time || 
          !formData.origin || !formData.destination) {
        throw new Error('Please fill in all required fields')
      }

      // Validate times
      const depTime = new Date(formData.departure_time)
      const arrTime = new Date(formData.arrival_time)
      
      if (depTime >= arrTime) {
        throw new Error('Arrival time must be after departure time')
      }

      if (depTime < new Date()) {
        throw new Error('Departure time cannot be in the past')
      }

      // Validate crew (captain and first officer cannot be the same)
      if (formData.captain_id && formData.first_officer_id && 
          formData.captain_id === formData.first_officer_id) {
        throw new Error('Captain and First Officer cannot be the same person')
      }

      // Clean up the data before submission
      const cleanedFormData: NewFlight = {
        ...formData,
        captain_id: formData.captain_id || undefined,
        first_officer_id: formData.first_officer_id || undefined,
        passenger_count: formData.passenger_count || 0,
        notes: formData.notes || undefined,
      }

      await onSubmit(cleanedFormData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create flight')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof NewFlight, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getCaptains = () => {
    return pilots.filter(pilot => 
      pilot.is_active && 
      ['captain', 'pilot'].includes(pilot.role) &&
      pilot.id !== formData.first_officer_id
    )
  }

  const getFirstOfficers = () => {
    return pilots.filter(pilot => 
      pilot.is_active && 
      ['first_officer', 'pilot', 'captain'].includes(pilot.role) &&
      pilot.id !== formData.captain_id
    )
  }

  const selectedAircraft = aircraft.find(a => a.id === formData.aircraft_id)

  // Scroll to top when error changes
  useEffect(() => {
    if (error && modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [error])

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent 
        ref={modalContentRef}
        className="max-w-7xl sm:max-w-7xl lg:max-w-7xl max-h-[95vh] overflow-y-auto p-8"
      >
        <DialogHeader className="space-y-4 pb-6 border-b">
          <DialogTitle className="flex items-center text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <Plane className="h-8 w-8 mr-3 text-blue-600" />
            Schedule New Flight
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600">
            Add a new flight to the schedule with aircraft and crew assignments
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-6">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 mt-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Aircraft & Flight Details */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="space-y-3 pb-6">
                <CardTitle className="flex items-center text-xl font-semibold">
                  <Plane className="h-6 w-6 mr-3 text-blue-600" />
                  Aircraft & Flight Details
                </CardTitle>
                <CardDescription className="text-base">
                  Select aircraft and specify flight information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="aircraft" className="flex items-center text-base font-medium">
                    <Plane className="h-5 w-5 mr-2 text-blue-500" />
                    Aircraft *
                  </Label>
                  <Select value={formData.aircraft_id} onValueChange={(value) => handleChange('aircraft_id', value)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select aircraft" />
                    </SelectTrigger>
                    <SelectContent>
                      {aircraft.map((aircraftItem) => (
                        <SelectItem key={aircraftItem.id} value={aircraftItem.id} className="py-3">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-base">{aircraftItem.tail_number}</span>
                            {aircraftItem.model && (
                              <span className="text-sm text-gray-500 ml-3">{aircraftItem.model}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAircraft && (
                    <div className="text-sm text-gray-600 mt-2 p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium">{selectedAircraft.model}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        {selectedAircraft.manufacturer && (
                          <span>• {selectedAircraft.manufacturer}</span>
                        )}
                        {selectedAircraft.max_passengers && (
                          <span>• Max {selectedAircraft.max_passengers} passengers</span>
                        )}
                        {selectedAircraft.max_range_nm && (
                          <span>• Range {selectedAircraft.max_range_nm} nm</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="flight_type" className="text-base font-medium">Flight Type</Label>
                  <Select value={formData.flight_type} onValueChange={(value) => handleChange('flight_type', value)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="charter" className="py-3">
                        <div className="flex items-center">
                          <span className="text-base">Charter</span>
                          <span className="text-xs text-gray-500 ml-2">• Commercial passenger flight</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="positioning" className="py-3">
                        <div className="flex items-center">
                          <span className="text-base">Positioning</span>
                          <span className="text-xs text-gray-500 ml-2">• Ferry flight</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="training" className="py-3">
                        <div className="flex items-center">
                          <span className="text-base">Training</span>
                          <span className="text-xs text-gray-500 ml-2">• Pilot training flight</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="maintenance" className="py-3">
                        <div className="flex items-center">
                          <span className="text-base">Maintenance</span>
                          <span className="text-xs text-gray-500 ml-2">• Test or maintenance flight</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="passenger_count" className="text-base font-medium">Passenger Count</Label>
                  <Input
                    id="passenger_count"
                    type="number"
                    min="0"
                    max={selectedAircraft?.max_passengers || 20}
                    value={formData.passenger_count}
                    onChange={(e) => handleChange('passenger_count', parseInt(e.target.value) || 0)}
                    disabled={loading}
                    className="h-12 text-base"
                    placeholder="Enter number of passengers"
                  />
                  {selectedAircraft?.max_passengers && (
                    <div className="text-xs text-gray-500">
                      Maximum capacity: {selectedAircraft.max_passengers} passengers
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Crew Assignment */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="space-y-3 pb-6">
                <CardTitle className="flex items-center text-xl font-semibold">
                  <Users className="h-6 w-6 mr-3 text-green-600" />
                  Crew Assignment
                </CardTitle>
                <CardDescription className="text-base">
                  Assign pilots to the flight (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="captain" className="flex items-center text-base font-medium">
                    <User className="h-5 w-5 mr-2 text-green-600" />
                    Captain
                  </Label>
                  <Select value={formData.captain_id || "none"} onValueChange={(value) => handleChange('captain_id', value === "none" ? "" : value)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select captain (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="py-3">
                        <span className="text-gray-500">No captain assigned</span>
                      </SelectItem>
                      {getCaptains().map((pilot) => (
                        <SelectItem key={pilot.id} value={pilot.id} className="py-3">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium text-base">{pilot.first_name} {pilot.last_name}</span>
                              <span className="text-xs text-gray-500">{pilot.certificate_number}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                {pilot.license_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                {pilot.total_hours}h
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="first_officer" className="flex items-center text-base font-medium">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    First Officer
                  </Label>
                  <Select value={formData.first_officer_id || "none"} onValueChange={(value) => handleChange('first_officer_id', value === "none" ? "" : value)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select first officer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="py-3">
                        <span className="text-gray-500">No first officer assigned</span>
                      </SelectItem>
                      {getFirstOfficers().map((pilot) => (
                        <SelectItem key={pilot.id} value={pilot.id} className="py-3">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium text-base">{pilot.first_name} {pilot.last_name}</span>
                              <span className="text-xs text-gray-500">{pilot.certificate_number}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                {pilot.license_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                {pilot.total_hours}h
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {pilots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-base font-medium">No pilots available</p>
                    <p className="text-sm mt-1">Pilots can be added in the Pilots tab</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Schedule & Route */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="flex items-center text-xl font-semibold">
                <Calendar className="h-6 w-6 mr-3 text-amber-600" />
                Schedule & Route
              </CardTitle>
              <CardDescription className="text-base">
                Set departure and arrival times and locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="departure_time" className="flex items-center text-base font-medium">
                    <Clock className="h-5 w-5 mr-2 text-amber-600" />
                    Departure Time *
                  </Label>
                  <Input
                    id="departure_time"
                    type="datetime-local"
                    value={formData.departure_time}
                    onChange={(e) => handleChange('departure_time', e.target.value)}
                    disabled={loading}
                    required
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="arrival_time" className="flex items-center text-base font-medium">
                    <Clock className="h-5 w-5 mr-2 text-amber-600" />
                    Arrival Time *
                  </Label>
                  <Input
                    id="arrival_time"
                    type="datetime-local"
                    value={formData.arrival_time}
                    onChange={(e) => handleChange('arrival_time', e.target.value)}
                    disabled={loading}
                    required
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="origin" className="flex items-center text-base font-medium">
                    <MapPin className="h-5 w-5 mr-2 text-green-600" />
                    Origin *
                  </Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => handleChange('origin', e.target.value.toUpperCase())}
                    placeholder="LAX"
                    disabled={loading}
                    required
                    className="h-12 text-base font-mono tracking-wider"
                    maxLength={4}
                  />
                  <div className="text-xs text-gray-500">Airport code (e.g., LAX, JFK)</div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="destination" className="flex items-center text-base font-medium">
                    <MapPin className="h-5 w-5 mr-2 text-red-600" />
                    Destination *
                  </Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => handleChange('destination', e.target.value.toUpperCase())}
                    placeholder="SFO"
                    disabled={loading}
                    required
                    className="h-12 text-base font-mono tracking-wider"
                    maxLength={4}
                  />
                  <div className="text-xs text-gray-500">Airport code (e.g., SFO, DEN)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="flex items-center text-xl font-semibold">
                <FileText className="h-6 w-6 mr-3 text-purple-600" />
                Additional Notes
              </CardTitle>
              <CardDescription className="text-base">
                Optional notes about the flight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Enter any additional notes about this flight (passenger requests, special equipment, catering requirements, etc.)"
                disabled={loading}
                rows={4}
                className="text-base resize-none"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-8 border-t bg-gray-50 -mx-8 px-8 pb-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="h-12 px-8 text-base"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="h-12 px-8 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Creating Flight...
                </>
              ) : (
                <>
                  <Plane className="h-5 w-5 mr-3" />
                  Create Flight
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 