'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Clock, Plane } from 'lucide-react'
import { FlightWithDetails } from '@/types'
import { formatDateTime } from '@/utils/flight-utils'

interface ConflictModalProps {
  open: boolean
  onClose: () => void
  conflictingFlights: FlightWithDetails[]
  selectedAircraft?: string
  selectedTime: {
    start: Date
    end: Date
  }
}

export function ConflictModal({ 
  open, 
  onClose, 
  conflictingFlights, 
  selectedAircraft,
  selectedTime 
}: ConflictModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl text-red-600">
            <AlertTriangle className="h-6 w-6 mr-2" />
            Schedule Conflict Detected
          </DialogTitle>
          <DialogDescription>
            The selected time slot conflicts with existing flights. Please choose a different time or aircraft.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Time Information */}
          <Alert className="border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Selected Time Slot:</strong> {formatDateTime(selectedTime.start.toISOString())} - {formatDateTime(selectedTime.end.toISOString())}
              {selectedAircraft && (
                <div className="mt-1">
                  <strong>Aircraft:</strong> {selectedAircraft}
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Conflicting Flights */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Plane className="h-4 w-4 mr-2 text-red-500" />
              Conflicting Flights ({conflictingFlights.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conflictingFlights.map((flight) => (
                <div 
                  key={flight.id} 
                  className="p-3 border border-red-200 bg-red-50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-red-800">
                        {flight.origin} → {flight.destination}
                      </div>
                      <div className="text-sm text-red-600">
                        {flight.aircraft?.tail_number || flight.aircraft_id} ({flight.aircraft?.model || 'Unknown'})
                      </div>
                    </div>
                    <div className="text-right text-sm text-red-600">
                      <div>{formatDateTime(flight.departure_time)}</div>
                      <div>{formatDateTime(flight.arrival_time)}</div>
                    </div>
                  </div>
                  {(flight.captain || flight.first_officer) && (
                    <div className="mt-2 text-xs text-red-600">
                      Crew: {flight.captain?.first_name || flight.first_officer?.first_name} {flight.captain?.last_name || flight.first_officer?.last_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              <strong>Suggestions:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Choose a different time slot when the aircraft is available</li>
                <li>• Select a different aircraft for this time period</li>
                <li>• Check the timeline for available gaps in the schedule</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 