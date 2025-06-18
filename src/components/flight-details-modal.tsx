'use client'

import { FlightWithDetails } from '@/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Plane, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Users,
  FileText,
  Phone,
  Mail,
  Timer,
  Navigation,
  Gauge,
  Award,
  UserCheck,
  X
} from 'lucide-react'
import moment from 'moment'

interface FlightDetailsModalProps {
  flight: FlightWithDetails | null
  open: boolean
  onClose: () => void
}

export function FlightDetailsModal({ flight, open, onClose }: FlightDetailsModalProps) {
  if (!flight) return null
  
  // Safety check for aircraft data
  if (!flight.aircraft) {
    console.warn('Flight data missing aircraft information:', flight)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Flight Details</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="text-gray-600">Flight data is incomplete. Aircraft information is missing.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const formatDateTime = (dateString: string) => {
    return moment(dateString).format('MMM DD, YYYY • h:mm A')
  }

  const formatTime = (dateString: string) => {
    return moment(dateString).format('h:mm A')
  }

  const formatDate = (dateString: string) => {
    return moment(dateString).format('MMM DD, YYYY')
  }

  const getFlightDuration = () => {
    const start = moment(flight.departure_time)
    const end = moment(flight.arrival_time)
    const duration = moment.duration(end.diff(start))
    return `${Math.floor(duration.asHours())}h ${duration.minutes()}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFlightTypeColor = (type: string) => {
    switch (type) {
      case 'charter': return 'bg-blue-100 text-blue-800'
      case 'positioning': return 'bg-amber-100 text-amber-800'
      case 'training': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl xl:max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="relative space-y-4 pb-6 border-b">
          <DialogTitle className="flex items-center text-3xl font-bold text-gray-900">
            <Plane className="h-8 w-8 mr-3 text-blue-600" />
            Flight Details
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Complete flight information and crew assignments
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <div className="space-y-8 mt-8">
          {/* Flight Overview */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center text-xl">
                  <Navigation className="h-5 w-5 mr-2 text-blue-600" />
                  Flight Route
                </span>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(flight.status)}>
                    {flight.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getFlightTypeColor(flight.flight_type)}>
                    {flight.flight_type.replace('_', ' ')}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Departure */}
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-800">{flight.origin}</div>
                  <div className="text-sm text-green-600 mt-1">Departure</div>
                  <div className="flex items-center justify-center mt-2 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(flight.departure_time)}
                  </div>
                  <div className="flex items-center justify-center mt-1 text-lg font-semibold text-green-700">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTime(flight.departure_time)}
                  </div>
                </div>

                {/* Flight Info */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-800 flex items-center justify-center">
                    <Timer className="h-5 w-5 mr-2" />
                    {getFlightDuration()}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">Flight Duration</div>
                  {flight.passenger_count > 0 && (
                    <div className="flex items-center justify-center mt-2 text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      {flight.passenger_count} passengers
                    </div>
                  )}
                </div>

                {/* Arrival */}
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-800">{flight.destination}</div>
                  <div className="text-sm text-red-600 mt-1">Arrival</div>
                  <div className="flex items-center justify-center mt-2 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(flight.arrival_time)}
                  </div>
                  <div className="flex items-center justify-center mt-1 text-lg font-semibold text-red-700">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTime(flight.arrival_time)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Aircraft Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plane className="h-5 w-5 mr-2 text-blue-600" />
                  Aircraft Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                                 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                   <div>
                     <div className="font-semibold text-lg">{flight.aircraft?.tail_number || 'Unknown Aircraft'}</div>
                     {flight.aircraft?.model && (
                       <div className="text-sm text-gray-600">{flight.aircraft.model}</div>
                     )}
                     {flight.aircraft?.manufacturer && (
                       <div className="text-xs text-gray-500">{flight.aircraft.manufacturer}</div>
                     )}
                   </div>
                   <Gauge className="h-8 w-8 text-blue-500" />
                 </div>
                
                                 {(flight.aircraft?.max_passengers || flight.aircraft?.max_range_nm || flight.aircraft?.year_manufactured) && (
                   <div className="grid grid-cols-1 gap-2 text-sm">
                     {flight.aircraft?.max_passengers && (
                       <div className="flex items-center justify-between">
                         <span className="text-gray-600">Max Passengers:</span>
                         <span className="font-medium">{flight.aircraft.max_passengers}</span>
                       </div>
                     )}
                     {flight.aircraft?.max_range_nm && (
                       <div className="flex items-center justify-between">
                         <span className="text-gray-600">Max Range:</span>
                         <span className="font-medium">{flight.aircraft.max_range_nm} nm</span>
                       </div>
                     )}
                     {flight.aircraft?.year_manufactured && (
                       <div className="flex items-center justify-between">
                         <span className="text-gray-600">Year:</span>
                         <span className="font-medium">{flight.aircraft.year_manufactured}</span>
                       </div>
                     )}
                   </div>
                 )}
              </CardContent>
            </Card>

            {/* Crew Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Flight Crew
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                                 {flight.captain ? (
                   <div className="p-3 bg-green-50 rounded-lg">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center">
                         <UserCheck className="h-5 w-5 mr-2 text-green-600" />
                         <span className="font-semibold text-green-800">Captain</span>
                       </div>
                       <Badge className="bg-green-100 text-green-800">
                         {flight.captain?.license_type || 'Unknown'}
                       </Badge>
                     </div>
                     <div className="space-y-1">
                       <div className="font-medium">
                         {flight.captain?.first_name || 'Unknown'} {flight.captain?.last_name || ''}
                       </div>
                       {flight.captain?.email && (
                         <div className="flex items-center text-sm text-gray-600">
                           <Mail className="h-3 w-3 mr-1" />
                           {flight.captain.email}
                         </div>
                       )}
                       {flight.captain?.phone && (
                         <div className="flex items-center text-sm text-gray-600">
                           <Phone className="h-3 w-3 mr-1" />
                           {flight.captain.phone}
                         </div>
                       )}
                       <div className="text-xs text-gray-500 mt-2">
                         {(flight.captain?.total_hours || 0).toLocaleString()} total hours • {(flight.captain?.pic_hours || 0).toLocaleString()} PIC hours
                       </div>
                     </div>
                   </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center text-gray-500">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <div className="text-sm">No Captain Assigned</div>
                  </div>
                )}

                                 {flight.first_officer ? (
                   <div className="p-3 bg-blue-50 rounded-lg">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center">
                         <User className="h-5 w-5 mr-2 text-blue-600" />
                         <span className="font-semibold text-blue-800">First Officer</span>
                       </div>
                       <Badge className="bg-blue-100 text-blue-800">
                         {flight.first_officer?.license_type || 'Unknown'}
                       </Badge>
                     </div>
                     <div className="space-y-1">
                       <div className="font-medium">
                         {flight.first_officer?.first_name || 'Unknown'} {flight.first_officer?.last_name || ''}
                       </div>
                       {flight.first_officer?.email && (
                         <div className="flex items-center text-sm text-gray-600">
                           <Mail className="h-3 w-3 mr-1" />
                           {flight.first_officer.email}
                         </div>
                       )}
                       {flight.first_officer?.phone && (
                         <div className="flex items-center text-sm text-gray-600">
                           <Phone className="h-3 w-3 mr-1" />
                           {flight.first_officer.phone}
                         </div>
                       )}
                       <div className="text-xs text-gray-500 mt-2">
                         {(flight.first_officer?.total_hours || 0).toLocaleString()} total hours • {(flight.first_officer?.pic_hours || 0).toLocaleString()} PIC hours
                       </div>
                     </div>
                   </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <div className="text-sm">No First Officer Assigned</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          {flight.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-600" />
                  Flight Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{flight.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flight Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                Flight Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Flight ID:</span>
                  <span className="font-mono">{flight.id.substring(0, 8)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Created:</span>
                  <span>{formatDateTime(flight.created_at)}</span>
                </div>
                {flight.updated_at !== flight.created_at && (
                  <div className="flex items-center justify-between">
                    <span>Last Updated:</span>
                    <span>{formatDateTime(flight.updated_at)}</span>
                  </div>
                )}
                {flight.created_by_pilot && (
                  <div className="flex items-center justify-between">
                    <span>Created By:</span>
                    <span>{flight.created_by_pilot.first_name} {flight.created_by_pilot.last_name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 