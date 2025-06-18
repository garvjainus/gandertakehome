'use client'

import { useState, useEffect } from 'react'
import { Aircraft, FlightWithDetails, NewFlight, PilotProfile } from '@/types'
import { FlightService } from '@/services/flight-service'
import { formatDateTime, getAircraftAvailability, checkFlightConflict, findConflictingFlights } from '@/utils/flight-utils'
import { useAuth } from '@/contexts/auth-context'
import { AddFlightModal } from './add-flight-modal'
import { PilotProfile as PilotProfileComponent } from './pilot/pilot-profile'
import { FlightTimeline } from './flight-timeline'
import { ConflictModal } from './conflict-modal'
import { FlightDetailsModal } from './flight-details-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plane, 
  Plus, 
  Calendar, 
  MapPin, 
  Clock, 
  AlertCircle, 
  User, 
  LogOut,
  Settings,
  FileText,
  Fuel,
  History,
  Map as MapIcon,
} from 'lucide-react'
import { DocumentVault } from './documents/document-vault'
import { FuelTracker } from './fuel-tracker'
import { AuditTrail } from './audit/audit-trail'
import { useRouter, useSearchParams } from 'next/navigation'
import { FlightMap } from './flight-map'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import AiChat from './ai-chat'

export function Dashboard() {
  const { profile, signOut } = useAuth()
  const [flights, setFlights] = useState<FlightWithDetails[]>([])
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [allFlights, setAllFlights] = useState<FlightWithDetails[]>([])
  const [pilots, setPilots] = useState<PilotProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [prefilledData, setPrefilledData] = useState<Partial<NewFlight> | null>(null)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [conflictData, setConflictData] = useState<{
    conflicts: FlightWithDetails[]
    selectedTime: { start: Date; end: Date }
    selectedAircraft?: string
  } | null>(null)
  const [showFlightDetailsModal, setShowFlightDetailsModal] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<FlightWithDetails | null>(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'dashboard'
  const [activeTab, setActiveTab] = useState(initialTab)

  const flightService = new FlightService()

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true)
      const [aircraftData, flightsData, allFlightsData, pilotsData] = await Promise.all([
        flightService.getAircraft(),
        flightService.getFlights(),
        flightService.getAllFlights(),
        flightService.getPilots()
      ])
      
      setAircraft(aircraftData)
      setFlights(flightsData)
      setAllFlights(allFlightsData)
      setPilots(pilotsData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFlight = async (newFlight: NewFlight) => {
    try {
      if (checkFlightConflict(newFlight, allFlights)) {
        throw new Error('Flight conflicts with existing schedule')
      }
      const created = await flightService.createFlight(newFlight)
      setFlights(prev => [...prev, created as any])
      setAllFlights(prev => [...prev, created as any])
      loadData()
      setShowModal(false)
    } catch (err) {
      throw err 
    }
  }

  const handleFlightSelect = (flight: FlightWithDetails) => {
    setSelectedFlight(flight)
    setShowFlightDetailsModal(true)
  }
  
  const handleMapSelect = (flight: FlightWithDetails) => {
    console.log('[Dashboard] Map icon clicked for flightId:', flight.id);
    setSelectedFlight(flight)
    setShowMapModal(true)
  }

  const handleSlotSelect = (slotInfo: any) => {
    const formatDateTimeLocal = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    const conflicts = findConflictingFlights(
      slotInfo.start,
      slotInfo.end,
      slotInfo.resourceId || null,
      allFlights
    )

    if (conflicts.length > 0) {
      const aircraftName = slotInfo.resourceId 
        ? aircraft.find(a => a.id === slotInfo.resourceId)?.tail_number
        : undefined

      setConflictData({
        conflicts: conflicts,
        selectedTime: { start: slotInfo.start, end: slotInfo.end },
        selectedAircraft: aircraftName
      })
      setShowConflictModal(true)
      return
    }

    const prefillData: Partial<NewFlight> = {
      departure_time: formatDateTimeLocal(slotInfo.start),
      arrival_time: formatDateTimeLocal(slotInfo.end),
      aircraft_id: slotInfo.resourceId || '',
    }
    
    setPrefilledData(prefillData)
    setShowModal(true)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'dispatcher': return 'bg-blue-100 text-blue-800';
      case 'captain': return 'bg-green-100 text-green-800';
      case 'first_officer': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(window.location.search)
    params.set('tab', value)
    router.replace('?' + params.toString(), { scroll: false })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Plane className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-700">Loading flight operations...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Plane Jane
            </h1>
            <p className="text-gray-600 mt-2">Part 135 Charter Scheduling Dashboard</p>
          </div>
          
          <div className="flex items-center gap-4">
            {profile && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile.first_name} {profile.last_name}
                </p>
                <Badge className={getRoleColor(profile.role)} variant="outline">
                  {profile.role.replace('_', ' ')}
                </Badge>
              </div>
            )}
            
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="fuel" className="flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              Fuel
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Audit
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setPrefilledData(null)
                  setShowModal(true)
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Flight
              </Button>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Plane className="h-6 w-6 mr-2 text-blue-600" />
                Aircraft Fleet Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aircraft.map((aircraftItem) => {
                  const availability = getAircraftAvailability(aircraftItem, allFlights)
                  const isAvailable = availability === 'Available'
                  
                  return (
                    <Card 
                      key={aircraftItem.id}
                      className={`transition-all duration-200 hover:shadow-lg ${
                        isAvailable 
                          ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' 
                          : 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-lg font-bold">{aircraftItem.tail_number}</span>
                          <Badge variant={isAvailable ? 'default' : 'secondary'} className={
                            isAvailable ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }>
                            {isAvailable ? 'Available' : 'Scheduled'}
                          </Badge>
                        </CardTitle>
                        {aircraftItem.model && (
                          <CardDescription className="text-sm font-medium">
                            {aircraftItem.model}
                            {aircraftItem.manufacturer && ` • ${aircraftItem.manufacturer}`}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className={`flex items-center text-sm font-medium ${
                          isAvailable ? 'text-green-700' : 'text-amber-700'
                        }`}>
                          <Clock className="h-4 w-4 mr-1" />
                          {availability}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Calendar className="h-6 w-6 mr-2 text-blue-600" />
                  Upcoming Flights
                </CardTitle>
                <CardDescription>
                  All scheduled flights ordered by departure time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flights.length === 0 ? (
                  <div className="text-center py-12">
                    <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No upcoming flights scheduled</p>
                    <p className="text-gray-400 text-sm mt-1">Click &ldquo;Add Flight&rdquo; to schedule your first flight</p>
                  </div>
                ) : (
                  <div className="rounded-lg border">
                 <Table>
                   <TableHeader>
                      <TableRow className="bg-gray-50/50">
                       <TableHead className="font-semibold">Aircraft</TableHead>
                          <TableHead className="font-semibold">Crew</TableHead>
                       <TableHead className="font-semibold">Departure</TableHead>
                       <TableHead className="font-semibold">Arrival</TableHead>
                          <TableHead className="font-semibold">Route</TableHead>
                          <TableHead className="font-semibold">Type</TableHead>
                       <TableHead className="font-semibold">Status</TableHead>
                       <TableHead className="font-semibold">Map</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {flights.map((flight) => (
                          <TableRow 
                            key={flight.id} 
                            className="hover:bg-gray-50/50 cursor-pointer"
                            onClick={() => handleFlightSelect(flight)}
                          >
                         <TableCell>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {flight.aircraft.tail_number}
                                </div>
                                {flight.aircraft.model && (
                                  <div className="text-sm text-gray-500">
                                    {flight.aircraft.model}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {flight.captain && (
                                  <div className="flex items-center text-xs">
                                    <User className="h-3 w-3 mr-1 text-green-600" />
                                    <span className="font-medium">
                                      {flight.captain.first_name} {flight.captain.last_name}
                                    </span>
                                  </div>
                                )}
                                {flight.first_officer && (
                                  <div className="flex items-center text-xs">
                                    <User className="h-3 w-3 mr-1 text-blue-600" />
                                    <span>
                                      {flight.first_officer.first_name} {flight.first_officer.last_name}
                                    </span>
                                  </div>
                                )}
                                {!flight.captain && !flight.first_officer && (
                                  <span className="text-xs text-gray-400">No crew assigned</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm">
                                <Clock className="h-3 w-3 mr-1 text-gray-400" />
                                {formatDateTime(flight.departure_time)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm">
                                <Clock className="h-3 w-3 mr-1 text-gray-400" />
                                {formatDateTime(flight.arrival_time)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="font-medium">{flight.origin}</span>
                                <MapPin className="h-3 w-3 mx-1 text-gray-400" />
                                <span className="font-medium">{flight.destination}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {flight.flight_type.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                         <TableCell>
                           <Badge variant={getStatusVariant(flight.status)}>
                                {flight.status.replace('_', ' ')}
                           </Badge>
                         </TableCell>
                         <TableCell>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={(e: React.MouseEvent) => { 
                               e.stopPropagation()
                               handleMapSelect(flight)
                             }}
                           >
                             <MapIcon className="h-4 w-4" />
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
             <FlightTimeline 
               aircraft={aircraft}
              flights={allFlights}
               onFlightSelect={handleFlightSelect}
               onSlotSelect={handleSlotSelect}
             />
           </TabsContent>

          <TabsContent value="fuel" className="mt-6">
            <FuelTracker aircraft={aircraft} flights={allFlights} />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <DocumentVault pilots={pilots} aircraft={aircraft} />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditTrail />
          </TabsContent>

          <TabsContent value="ai-assistant" className="mt-6">
            <AiChat />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <PilotProfileComponent />
          </TabsContent>
        </Tabs>
        
        {showModal && (
         <AddFlightModal
           aircraft={aircraft}
           pilots={pilots}
            onClose={() => {
              setShowModal(false)
              setPrefilledData(null)
            }}
            onSubmit={handleAddFlight}
            prefilledData={prefilledData}
         />
        )}

        {showConflictModal && conflictData && (
         <ConflictModal
            open={showConflictModal}
            onClose={() => {
              setShowConflictModal(false)
              setConflictData(null)
            }}
            conflictingFlights={conflictData.conflicts}
            selectedAircraft={conflictData.selectedAircraft}
            selectedTime={conflictData.selectedTime}
         />
        )}

        <FlightDetailsModal
           flight={selectedFlight}
          open={showFlightDetailsModal}
          onClose={() => {
            setShowFlightDetailsModal(false)
            setSelectedFlight(null)
          }}
        />

        {showMapModal && selectedFlight && (
          <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Flight Map: {selectedFlight.origin} to {selectedFlight.destination}</DialogTitle>
              </DialogHeader>
              <FlightMap flightId={selectedFlight.id} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
} 