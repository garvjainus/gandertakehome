import { FeatureCollection } from 'geojson';

// Cache for weather data to avoid hitting the API too frequently.
// In a real production app, use Vercel KV, Redis, or a similar caching service.
let sigmetCache: { data: FeatureCollection | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the latest SIGMETs from the NOAA Aviation Weather Center.
 * Results are cached for 5 minutes.
 * @returns A GeoJSON FeatureCollection of SIGMET polygons.
 */
export async function fetchSigmets(): Promise<FeatureCollection> {
  const now = Date.now();
  if (sigmetCache.data && now - sigmetCache.timestamp < CACHE_DURATION_MS) {
    console.log('Returning cached SIGMETs.');
    return sigmetCache.data;
  }

  console.log('Fetching fresh SIGMETs...');
  try {
    const response = await fetch(
      'https://www.aviationweather.gov/adds/dataserver_current/httpparam' +
      '?dataSource=sigmets&requestType=retrieve&format=geojson&hoursBeforeNow=3',
      {
        // Use Vercel's recommended caching strategy for fetches
        next: { revalidate: CACHE_DURATION_MS / 1000 },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch SIGMETs: ${response.statusText}`);
    }

    const data: FeatureCollection = await response.json();
    
    // Update cache
    sigmetCache = { data, timestamp: now };

    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Return empty collection on error
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Provides a URL for a weather radar tile layer using OpenWeatherMap API.
 * @returns A URL template for XYZ weather radar tiles.
 */
export function getRadarTileUrl(): string {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn('NEXT_PUBLIC_OPENWEATHER_API_KEY not set. Weather radar may not work.');
    return '';
  }
  
  // OpenWeatherMap Precipitation layer (radar)
  // Using the Maps API 1.0 for tile layers
  return `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`;
}

/**
 * Fetches current weather data for a specific location using OpenWeatherMap API.
 * @param lat Latitude
 * @param lon Longitude
 * @returns Weather data object
 */
export async function fetchWeatherData(lat: number, lon: number) {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
} 