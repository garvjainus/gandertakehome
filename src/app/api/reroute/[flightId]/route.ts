// @ts-nocheck
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchSigmets, getRadarTileUrl } from '@/lib/weatherService';
import { lineString, booleanIntersects, union, bbox, buffer } from '@turf/turf';
import type { Feature, LineString, Polygon } from 'geojson';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Fallback to anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Define hardcoded coordinates for airports for demo purposes
// In a real app, this would come from a database (e.g., an 'airports' table)
const airportCoords: { [key: string]: [number, number] } = {
  LAX: [-118.4085, 33.9416],
  SFO: [-122.3790, 37.6213],
  LAS: [-115.1537, 36.0840],
  JFK: [-73.7781, 40.6413],
  SEA: [-122.3088, 47.4502],
  DEN: [-104.6737, 39.8617],
  ATL: [-84.4277, 33.6407],
  DFW: [-97.0403, 32.8998],
  PHX: [-112.0116, 33.4343],
  SAN: [-117.1897, 32.7338],
  PDX: [-122.5973, 45.5898],
  MCO: [-81.3090, 28.4312],
  IAH: [-95.3414, 29.9902],
  ORD: [-87.9073, 41.9742],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Record<string, string> }
) {
  const { flightId } = params;

  if (!flightId) {
    return NextResponse.json({ error: 'Flight ID is required' }, { status: 400 });
  }

  console.log('[API] /reroute called with flightId:', flightId);

  try {
    // 1. Fetch flight data from Supabase
    const { data: flight, error: flightError } = await supabase
      .from('flights')
      .select('id, origin, destination, path, alt_path')
      .eq('id', flightId)
      .maybeSingle();

    if (flightError) {
      console.error('Supabase query error:', flightError.message);
      return NextResponse.json({ error: 'Database query error', details: flightError.message }, { status: 500 });
    }
    if (!flight) return NextResponse.json({ error: 'Flight not found' }, { status: 404 });

    console.log('[API] Supabase returned flight:', flight?.id || null);

    // 2. Get origin and destination coordinates
    const startCoords = airportCoords[flight.origin];
    const endCoords = airportCoords[flight.destination];

    if (!startCoords || !endCoords) {
      return NextResponse.json({ error: 'Unknown airport coordinates for this route' }, { status: 400 });
    }

    // 3. Create the great-circle path if it doesn't exist
    let flightPath: Feature<LineString> = flight.path as Feature<LineString>;
    if (!flightPath) {
      flightPath = lineString([startCoords, endCoords], { id: flight.id });
      // Persist the new path to the database asynchronously
      supabase
        .from('flights')
        .update({ path: flightPath.geometry })
        .eq('id', flightId)
        .then(({ error }) => {
          if (error) console.error('Error saving flight path:', error.message);
        });
    }

    // 4. Fetch weather data
    const weatherPolygons = await fetchSigmets();
    const intersectingWeather: Feature<Polygon>[] = [];

    // 5. Check for intersections
    if (weatherPolygons.features.length > 0) {
      for (const weatherFeat of weatherPolygons.features as Feature[]) {
        if (weatherFeat && booleanIntersects(flightPath as any, weatherFeat as any)) {
          intersectingWeather.push(weatherFeat as Feature<Polygon>);
        }
      }
    }

    let alternatePath: Feature<LineString> | null = null;

    // 6. Generate alternate route if there are intersections
    if (intersectingWeather.length > 0) {
      try {
        // Simple box-avoidance heuristic
        // @ts-expect-error Turf.js union function has complex typing issues with Feature arrays
        const mergedIntersections = union(...intersectingWeather);
        if (mergedIntersections) {
          const safeBox = buffer(mergedIntersections, 0.5, { units: 'degrees' });
          const [minX, minY, maxX, maxY] = bbox(safeBox);
          
          // A very simple tangent logic: go around the bounding box
          const waypoints = [
            startCoords,
            [minX, minY],
            [maxX, maxY],
            endCoords,
          ];
          alternatePath = lineString(waypoints, { name: 'Alternate Route' });

          // Persist the alternate path to the database asynchronously
          supabase
            .from('flights')
            .update({ alt_path: alternatePath.geometry })
            .eq('id', flightId)
            .then(({ error }) => {
              if (error) console.error('Error saving alternate path:', error.message);
            });
        }
      } catch (turfError) {
        console.error("Error during Turf.js operation:", turfError);
        // Fallback or error handling if Turf operations fail
      }
    }

    // 7. Return response
    return NextResponse.json({
      path: flightPath,
      altPath: alternatePath,
      // Return all weather polygons so the client can visualize overall weather
      weather: weatherPolygons.features,
      // Additionally, provide intersecting polygons explicitly (could be used for UI warnings)
      conflictWeather: intersectingWeather,
      radarTileUrl: getRadarTileUrl(),
    });

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
} 