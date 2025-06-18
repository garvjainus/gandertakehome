'use client'

import { useState, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer, Views, Event, View, SlotInfo } from 'react-big-calendar'
import moment from 'moment'
import { Aircraft, FlightWithDetails } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plane, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  AlertCircle,
  Filter
} from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface FlightEvent extends Event {
  id: string
  aircraft_id: string
  flight: FlightWithDetails
  resource?: string
}

interface FlightTimelineProps {
  aircraft: Aircraft[]
  flights: FlightWithDetails[]
  onFlightSelect?: (flight: FlightWithDetails) => void
  onSlotSelect?: (slotInfo: SlotInfo) => void
}

export function FlightTimeline({ 
  aircraft, 
  flights, 
  onFlightSelect, 
  onSlotSelect 
}: FlightTimelineProps) {
  const [currentView, setCurrentView] = useState<View>(Views.WEEK)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAircraft, setSelectedAircraft] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  // Transform flights into calendar events
  const events: FlightEvent[] = useMemo(() => {
    const filteredFlights = selectedAircraft === 'all' 
      ? flights 
      : flights.filter(f => f.aircraft_id === selectedAircraft)

    return filteredFlights.map(flight => ({
      id: flight.id,
      title: `${flight.origin} → ${flight.destination}`,
      start: new Date(flight.departure_time),
      end: new Date(flight.arrival_time),
      aircraft_id: flight.aircraft_id,
      flight,
      resourceId: flight.aircraft_id,
      allDay: false,
    }))
  }, [flights, selectedAircraft])

  // Create resources (aircraft) for resource view
  const resources = useMemo(() => {
    const aircraftToShow = selectedAircraft === 'all' 
      ? aircraft 
      : aircraft.filter(a => a.id === selectedAircraft)

    return aircraftToShow.map(a => ({
      resourceId: a.id,
      resourceTitle: `${a.tail_number} (${a.model || 'Unknown'})`
    }))
  }, [aircraft, selectedAircraft])

  // Custom event component
  const EventComponent = ({ event }: { event: FlightEvent }) => {
    const flight = event.flight
    const duration = moment(event.end).diff(moment(event.start), 'hours', true)
    
    const getFlightTypeColor = (type: string) => {
      switch (type) {
        case 'charter': return 'bg-blue-500'
        case 'positioning': return 'bg-amber-500'
        case 'training': return 'bg-green-500'
        case 'maintenance': return 'bg-red-500'
        default: return 'bg-gray-500'
      }
    }

    return (
      <div className="h-full p-1 text-white text-xs overflow-hidden">
        <div className="font-semibold truncate">{event.title}</div>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3" />
          <span>{duration.toFixed(1)}h</span>
        </div>
        {flight.flight_type && (
          <Badge 
            variant="secondary" 
            className={`${getFlightTypeColor(flight.flight_type)} text-white text-xs mt-1`}
          >
            {flight.flight_type}
          </Badge>
        )}
        {(flight.captain || flight.first_officer) && (
          <div className="flex items-center gap-1 mt-1">
            <Users className="h-3 w-3" />
            <span className="truncate">
              {flight.captain?.first_name || flight.first_officer?.first_name}
            </span>
          </div>
        )}
      </div>
    )
  }

  // Handle event selection
  const handleSelectEvent = useCallback((event: FlightEvent) => {
    if (onFlightSelect) {
      onFlightSelect(event.flight)
    }
  }, [onFlightSelect])

  // Handle slot selection (for creating new flights)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    if (onSlotSelect) {
      onSlotSelect(slotInfo)
    }
  }, [onSlotSelect])

  // Custom event style
  const eventStyleGetter = (event: FlightEvent) => {
    const flight = event.flight
    let backgroundColor = '#3174ad'
    
    switch (flight.flight_type) {
      case 'charter':
        backgroundColor = '#3b82f6' // blue
        break
      case 'positioning':
        backgroundColor = '#f59e0b' // amber
        break
      case 'training':
        backgroundColor = '#10b981' // emerald
        break
      case 'maintenance':
        backgroundColor = '#ef4444' // red
        break
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => onNavigate('PREV')}
          className="h-10"
        >
          ←
        </Button>
        <h3 className="text-lg font-semibold">{label}</h3>
        <Button 
          variant="outline" 
          onClick={() => onNavigate('NEXT')}
          className="h-10"
        >
          →
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onNavigate('TODAY')}
          className="h-10"
        >
          Today
        </Button>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by aircraft" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Aircraft</SelectItem>
              {aircraft.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.tail_number} ({a.model || 'Unknown'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-1 border rounded-md">
          <Button
            variant={currentView === Views.DAY ? 'default' : 'ghost'}
            onClick={() => onView(Views.DAY)}
            className="h-10 rounded-none"
          >
            Day
          </Button>
          <Button
            variant={currentView === Views.WEEK ? 'default' : 'ghost'}
            onClick={() => onView(Views.WEEK)}
            className="h-10 rounded-none"
          >
            Week
          </Button>
          <Button
            variant={currentView === Views.MONTH ? 'default' : 'ghost'}
            onClick={() => onView(Views.MONTH)}
            className="h-10 rounded-none"
          >
            Month
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <CalendarIcon className="h-6 w-6 mr-3 text-blue-600" />
          Flight Schedule Timeline
        </CardTitle>
        <div className="text-sm text-gray-600">
          Visual timeline view of flight schedules • Click flights for details • Click empty slots to create new flights
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Flight Types:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs">Charter</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-xs">Positioning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs">Training</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs">Maintenance</span>
          </div>
        </div>

        <div>
          <Calendar
            localizer={localizer}
            events={events}
            resources={selectedAircraft !== 'all' ? resources : undefined}
            resourceIdAccessor="resourceId"
            resourceTitleAccessor="resourceTitle"
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            view={currentView}
            onView={setCurrentView}
            date={currentDate}
            onNavigate={setCurrentDate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            components={{
              event: EventComponent,
              toolbar: CustomToolbar,
            }}
            eventPropGetter={eventStyleGetter}
            step={30}
            timeslots={2}
            defaultView={Views.WEEK}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            min={new Date(2024, 0, 1, 6, 0)} // 6 AM
            max={new Date(2024, 0, 1, 23, 0)} // 11 PM
            dayLayoutAlgorithm="no-overlap"
            popup
            showMultiDayTimes
          />
        </div>
      </CardContent>
    </Card>
  )
} 