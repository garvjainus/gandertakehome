'use client';

import React, { useState, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import { Loader2, AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface FlightMapProps {
  flightId: string;
}

interface RerouteData {
  path: GeoJSON.Feature<GeoJSON.LineString>;
  altPath: GeoJSON.Feature<GeoJSON.LineString> | null;
  weather: GeoJSON.Feature<GeoJSON.Polygon>[];
  radarTileUrl: string;
}

const flightPathLayer = {
  id: 'flight-path',
  type: 'line',
  paint: {
    'line-color': '#2563eb',
    'line-width': 4,
  },
} as any;

const altPathLayer = {
  id: 'alt-path',
  type: 'line',
  paint: {
    'line-color': '#f59e0b',
    'line-width': 4,
    'line-dasharray': [2, 2],
  },
} as any;

const weatherLayer = {
  id: 'weather-polygons',
  type: 'fill',
  paint: {
    'fill-color': '#ef4444',
    'fill-opacity': 0.3,
  },
} as any;

export function FlightMap({ flightId }: FlightMapProps) {
  const [data, setData] = useState<RerouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState({
    longitude: -98,
    latitude: 39,
    zoom: 3,
  });

  useEffect(() => {
    async function fetchData() {
      if (!flightId) return;
      console.log('[FlightMap] Fetching reroute data for flightId:', flightId);
      if (!MAPBOX_TOKEN) {
        setError('Mapbox token is not configured.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/reroute/${flightId}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch route data');
        }
        const result: RerouteData = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [flightId]);

  const handleAcceptAlternate = async () => {
    alert('Alternate route accepted! (Implementation pending)');
  };

  const handleRejectAlternate = () => {
    alert('Alternate route rejected.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2">Loading Map Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="ml-2">Error: {error}</p>
      </div>
    );
  }

  const rasterLayer = {
    id: 'radar-layer',
    type: 'raster',
    paint: {
      'raster-opacity': 0.5,
    },
  } as any;

  return (
    <div className="relative h-[600px] w-full rounded-lg overflow-hidden">
      {data?.altPath && (
        <Alert className="absolute top-2 left-2 z-10 w-auto max-w-md bg-white/90 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-bold">Weather on Route</p>
              <p>An alternate path is suggested.</p>
            </div>
            <div className="flex space-x-2 ml-4">
              <Button size="sm" variant="outline" onClick={handleAcceptAlternate}>
                <Check className="h-4 w-4 mr-1" /> Accept
              </Button>
              <Button size="sm" variant="destructive" onClick={handleRejectAlternate}>
                <X className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Map
        {...viewport}
        onMove={(evt: any) => setViewport(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl />
        <FullscreenControl />
        
        {data?.radarTileUrl && (
            <Source id="radar-source" type="raster" tiles={[data.radarTileUrl]} tileSize={256}>
                <Layer {...rasterLayer} />
            </Source>
        )}
        
        {data?.path && (
          <Source id="flight-source" type="geojson" data={data.path}>
            <Layer {...flightPathLayer} />
          </Source>
        )}
        
        {data?.altPath && (
          <Source id="alt-source" type="geojson" data={data.altPath}>
            <Layer {...altPathLayer} />
          </Source>
        )}
        
        {data?.weather && data.weather.length > 0 && (
          <Source id="weather-source" type="geojson" data={{ type: 'FeatureCollection', features: data.weather }}>
            <Layer {...weatherLayer} />
          </Source>
        )}
      </Map>
    </div>
  );
} 