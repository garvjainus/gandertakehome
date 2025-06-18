import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Function definitions for the AI agent
const functions = [
  {
    name: 'check_aircraft_legality',
    description: 'Check if an aircraft can legally fly a specific route on a given date',
    parameters: {
      type: 'object',
      properties: {
        tail_number: { type: 'string', description: 'Aircraft tail number (e.g., N123AB)' },
        origin: { type: 'string', description: 'Origin airport code' },
        destination: { type: 'string', description: 'Destination airport code' },
        date: { type: 'string', description: 'Flight date in YYYY-MM-DD format' }
      },
      required: ['tail_number', 'origin', 'destination', 'date']
    }
  },
  {
    name: 'generate_loa_template',
    description: 'Generate a Letter of Authorization template for operations',
    parameters: {
      type: 'object',
      properties: {
        operation_type: { type: 'string', description: 'Type of operation (charter, training, positioning, etc.)' },
        aircraft_type: { type: 'string', description: 'Aircraft model/type' },
        special_requirements: { type: 'string', description: 'Any special requirements or notes' }
      },
      required: ['operation_type', 'aircraft_type']
    }
  },
  {
    name: 'check_flight_conflicts',
    description: 'Check for duty time, maintenance, or scheduling conflicts for a flight',
    parameters: {
      type: 'object',
      properties: {
        flight_id: { type: 'string', description: 'Flight ID to check' },
        pilot_id: { type: 'string', description: 'Optional: specific pilot ID to check' },
        aircraft_id: { type: 'string', description: 'Optional: specific aircraft ID to check' }
      },
      required: ['flight_id']
    }
  },
  {
    name: 'search_regulations',
    description: 'Search Part 135 regulations and SOPs for specific topics',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query for regulations or procedures' }
      },
      required: ['query']
    }
  }
];

// Function implementations
async function checkAircraftLegality(tail_number: string, origin: string, destination: string, date: string) {
  try {
    // Get aircraft info
    const { data: aircraft, error: aircraftError } = await supabase
      .from('aircraft')
      .select('*')
      .eq('tail_number', tail_number)
      .single();

    if (aircraftError || !aircraft) {
      return { legal: false, reason: `Aircraft ${tail_number} not found in database` };
    }

    if (!aircraft.is_active) {
      return { legal: false, reason: `Aircraft ${tail_number} is not active` };
    }

    // Check for maintenance conflicts
    const { data: maintenance, error: maintError } = await supabase
      .from('docs_meta')
      .select('*')
      .eq('entity_id', aircraft.id)
      .eq('entity_type', 'aircraft')
      .eq('is_critical', true)
      .lt('expiry_date', date);

    if (maintError) {
      console.error('Maintenance check error:', maintError);
    }

    if (maintenance && maintenance.length > 0) {
      const expiredDocs = maintenance.map(doc => doc.doc_type).join(', ');
      return { 
        legal: false, 
        reason: `Aircraft ${tail_number} has expired critical documents: ${expiredDocs}` 
      };
    }

    // Check for existing conflicts on that date
    const { data: conflicts, error: conflictError } = await supabase
      .from('flights')
      .select('*')
      .eq('aircraft_id', aircraft.id)
      .gte('departure_time', date)
      .lt('departure_time', `${date}T23:59:59`)
      .neq('status', 'cancelled');

    if (conflictError) {
      console.error('Conflict check error:', conflictError);
    }

    if (conflicts && conflicts.length > 0) {
      return { 
        legal: false, 
        reason: `Aircraft ${tail_number} already has ${conflicts.length} flight(s) scheduled on ${date}` 
      };
    }

    return { 
      legal: true, 
      reason: `Aircraft ${tail_number} is legally available for ${origin} to ${destination} on ${date}`,
      aircraft_info: {
        model: aircraft.model,
        max_passengers: aircraft.max_passengers,
        max_range_nm: aircraft.max_range_nm
      }
    };

  } catch (error) {
    console.error('Aircraft legality check error:', error);
    return { legal: false, reason: 'Error checking aircraft legality' };
  }
}

function generateLoaTemplate(operation_type: string, aircraft_type: string, special_requirements?: string) {
  const template = `
LETTER OF AUTHORIZATION
Part 135 Operations

Date: ${new Date().toLocaleDateString()}

TO: Federal Aviation Administration
Flight Standards District Office

FROM: [Operator Name]
Certificate Number: [Certificate Number]

SUBJECT: Request for Letter of Authorization - ${operation_type.toUpperCase()} Operations

Dear Sir or Madam:

We hereby request a Letter of Authorization to conduct ${operation_type} operations under Part 135 using the following aircraft:

Aircraft Type: ${aircraft_type}
Registration: [Aircraft Registration]
Serial Number: [Serial Number]

OPERATION DETAILS:
- Type of Operation: ${operation_type}
- Proposed Area of Operations: [Specify geographic area]
- Estimated Duration: [Time period]
${special_requirements ? `- Special Requirements: ${special_requirements}` : ''}

COMPLIANCE STATEMENT:
We certify that:
1. All required pilot qualifications under Part 135 will be met
2. Aircraft meets all airworthiness requirements
3. Operations will be conducted in accordance with our approved Operations Specifications
4. All required documentation and insurance coverage is current

ATTACHMENTS:
- Pilot certificates and medical certificates
- Aircraft airworthiness certificate
- Proof of insurance
- Detailed flight plan and route information

We request approval for these operations and stand ready to provide any additional information required.

Respectfully submitted,

[Name]
[Title]
[Contact Information]

Certificate Holder: [Operator Name]
Date: ${new Date().toLocaleDateString()}
`;

  return template;
}

async function checkFlightConflicts(flight_id: string, _pilotId?: string, _aircraftId?: string) {
  try {
    // Get flight details
    const { data: flight, error: flightError } = await supabase
      .from('flights')
      .select(`
        *,
        aircraft:aircraft_id(tail_number, model),
        captain:captain_id(first_name, last_name),
        first_officer:first_officer_id(first_name, last_name)
      `)
      .eq('id', flight_id)
      .single();

    if (flightError || !flight) {
      return { conflicts: [], error: 'Flight not found' };
    }

    const conflicts = [];

    // Check aircraft availability
    if (flight.aircraft_id) {
      const { data: aircraftConflicts } = await supabase
        .from('flights')
        .select('*')
        .eq('aircraft_id', flight.aircraft_id)
        .neq('id', flight_id)
        .neq('status', 'cancelled')
        .or(`departure_time.lte.${flight.arrival_time},arrival_time.gte.${flight.departure_time}`);

      if (aircraftConflicts && aircraftConflicts.length > 0) {
        conflicts.push({
          type: 'aircraft_conflict',
          message: `Aircraft ${flight.aircraft.tail_number} has ${aircraftConflicts.length} overlapping flight(s)`,
          details: aircraftConflicts
        });
      }
    }

    // Check pilot duty time (simplified - in reality would be more complex)
    if (flight.captain_id) {
      const { data: pilotFlights } = await supabase
        .from('flights')
        .select('*')
        .eq('captain_id', flight.captain_id)
        .gte('departure_time', new Date(new Date(flight.departure_time).getTime() - 24 * 60 * 60 * 1000).toISOString())
        .lte('departure_time', flight.departure_time)
        .neq('status', 'cancelled');

      if (pilotFlights && pilotFlights.length >= 3) {
        conflicts.push({
          type: 'duty_time_conflict',
          message: `Captain may exceed duty time limits - ${pilotFlights.length} flights in 24 hours`,
          details: pilotFlights
        });
      }
    }

    return { 
      conflicts, 
      flight_info: {
        route: `${flight.origin} → ${flight.destination}`,
        departure: flight.departure_time,
        aircraft: flight.aircraft?.tail_number,
        captain: flight.captain ? `${flight.captain.first_name} ${flight.captain.last_name}` : 'TBD'
      }
    };

  } catch (error) {
    console.error('Conflict check error:', error);
    return { conflicts: [], error: 'Error checking conflicts' };
  }
}

async function searchRegulations(query: string) {
  // In a real implementation, this would use pgvector similarity search
  // For now, return mock regulatory guidance
  const mockResults = {
    'duty time': 'Part 135.263: Flight time limitations - No certificate holder may schedule and no pilot may accept an assignment if the pilot\'s total flight time will exceed 1,200 hours in any calendar year.',
    'maintenance': 'Part 135.411: Applicability - This subpart prescribes rules for the maintenance, preventive maintenance, and alteration of each aircraft.',
    'weather minimums': 'Part 135.225: IFR takeoff, approach and landing minimums - No pilot may begin an IFR flight unless the weather conditions at the airport of intended landing are at or above authorized minimums.',
    'pilot qualifications': 'Part 135.243: Pilot in command qualifications - No certificate holder may use a pilot as pilot in command unless that pilot holds an airline transport pilot certificate with appropriate category and class ratings.'
  };

  const searchKey = Object.keys(mockResults).find(key => 
    query.toLowerCase().includes(key.toLowerCase())
  );

  return {
    query,
    results: searchKey ? [mockResults[searchKey as keyof typeof mockResults]] : ['No specific regulation found for this query. Please consult the full Part 135 regulations.']
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const systemPrompt = `You are an AI assistant for Part 135 charter flight operations. You help dispatchers, pilots, and operations staff with:

1. Aircraft legality checks (airworthiness, availability, maintenance status)
2. Generating Letter of Authorization templates
3. Identifying flight conflicts (duty time, maintenance, scheduling)
4. Searching Part 135 regulations and SOPs

Always be precise about regulatory compliance and safety. When in doubt, recommend consulting with the Chief Pilot or POI (Principal Operations Inspector).

Available functions:
- check_aircraft_legality: Verify if an aircraft can legally operate a route
- generate_loa_template: Create LOA templates for special operations
- check_flight_conflicts: Identify scheduling/duty/maintenance conflicts
- search_regulations: Find relevant Part 135 regulations

Be helpful, accurate, and safety-focused in all responses.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      functions,
      function_call: 'auto',
      stream: false
    });

    const message = completion.choices[0].message;

    // Handle function calls
    if (message.function_call) {
      const { name, arguments: args } = message.function_call;
      const parsedArgs = JSON.parse(args);
      
      let functionResult;
      
      switch (name) {
        case 'check_aircraft_legality':
          functionResult = await checkAircraftLegality(
            parsedArgs.tail_number,
            parsedArgs.origin,
            parsedArgs.destination,
            parsedArgs.date
          );
          break;
          
        case 'generate_loa_template':
          functionResult = generateLoaTemplate(
            parsedArgs.operation_type,
            parsedArgs.aircraft_type,
            parsedArgs.special_requirements
          );
          break;
          
        case 'check_flight_conflicts':
          functionResult = await checkFlightConflicts(
            parsedArgs.flight_id,
            parsedArgs.pilot_id,
            parsedArgs.aircraft_id
          );
          break;
          
        case 'search_regulations':
          functionResult = await searchRegulations(parsedArgs.query);
          break;
          
        default:
          functionResult = { error: 'Unknown function' };
      }

      // Get AI response with function result
      const followUp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          message,
          {
            role: 'function',
            name,
            content: JSON.stringify(functionResult)
          }
        ]
      });

      return NextResponse.json({
        message: followUp.choices[0].message.content,
        function_call: {
          name,
          result: functionResult
        }
      });
    }

    return NextResponse.json({
      message: message.content
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 