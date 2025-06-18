// Test cases for weather-aware flight mapping feature
const { describe, test, expect } = require('@jest/globals');

describe('Weather-Aware Flight Mapping', () => {
  const testFlightId = '07799d86-be54-4a61-bfe7-9ae75550fe94';
  const apiUrl = 'http://localhost:3000';

  test('API endpoint should return flight data without 404 error', async () => {
    const response = await fetch(`${apiUrl}/api/reroute/${testFlightId}`);
    
    expect(response.status).not.toBe(404);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('path');
    expect(data).toHaveProperty('weather');
    expect(data).toHaveProperty('radarTileUrl');
  });

  test('Flight path should be a valid GeoJSON LineString', async () => {
    const response = await fetch(`${apiUrl}/api/reroute/${testFlightId}`);
    const data = await response.json();
    
    expect(data.path).toHaveProperty('type', 'Feature');
    expect(data.path).toHaveProperty('geometry');
    expect(data.path.geometry).toHaveProperty('type', 'LineString');
    expect(data.path.geometry.coordinates).toHaveLength(2); // Start and end points
  });

  test('Weather data should be an array of polygons', async () => {
    const response = await fetch(`${apiUrl}/api/reroute/${testFlightId}`);
    const data = await response.json();
    
    expect(Array.isArray(data.weather)).toBe(true);
    
    // If weather intersections exist, each should be a valid polygon
    if (data.weather.length > 0) {
      data.weather.forEach(weatherFeat => {
        expect(weatherFeat).toHaveProperty('type', 'Feature');
        expect(weatherFeat.geometry).toHaveProperty('type', 'Polygon');
      });
    }
  });

  test('Should generate alternate path when weather intersections exist', async () => {
    const response = await fetch(`${apiUrl}/api/reroute/${testFlightId}`);
    const data = await response.json();
    
    // If there are weather intersections, there should be an alternate path
    if (data.weather.length > 0) {
      expect(data.altPath).toBeTruthy();
      expect(data.altPath).toHaveProperty('geometry');
      expect(data.altPath.geometry).toHaveProperty('type', 'LineString');
    }
  });

  test('Radar tile URL should be a valid URL', async () => {
    const response = await fetch(`${apiUrl}/api/reroute/${testFlightId}`);
    const data = await response.json();
    
    expect(typeof data.radarTileUrl).toBe('string');
    expect(data.radarTileUrl).toMatch(/^https?:\/\//);
  });

  test('LAX to SFO route should have correct coordinates', async () => {
    const response = await fetch(`${apiUrl}/api/reroute/${testFlightId}`);
    const data = await response.json();
    
    const [startCoord, endCoord] = data.path.geometry.coordinates;
    
    // LAX coordinates: [-118.4085, 33.9416]
    expect(startCoord[0]).toBeCloseTo(-118.4085, 2);
    expect(startCoord[1]).toBeCloseTo(33.9416, 2);
    
    // SFO coordinates: [-122.3790, 37.6213]
    expect(endCoord[0]).toBeCloseTo(-122.3790, 2);
    expect(endCoord[1]).toBeCloseTo(37.6213, 2);
  });
});

// Manual test function for interactive testing
async function runManualTest() {
  console.log('🧪 Running manual weather mapping test...\n');
  
  try {
    const response = await fetch(`http://localhost:3000/api/reroute/07799d86-be54-4a61-bfe7-9ae75550fe94`);
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response received');
      console.log('🗺️  Flight path coordinates:', data.path.geometry.coordinates.length);
      console.log('🌦️  Weather intersections:', data.weather.length);
      console.log('🔄 Alternate path:', data.altPath ? 'Generated' : 'Not needed');
      console.log('📡 Radar URL:', data.radarTileUrl ? 'Available' : 'Missing');
      
      return { success: true, data };
    } else {
      console.error('❌ API Error:', response.status, response.statusText);
      const errorData = await response.json();
      console.error('Error details:', errorData);
      return { success: false, error: errorData };
    }
  } catch (error) {
    console.error('❌ Network/Runtime Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Export for manual testing
if (require.main === module) {
  runManualTest().then(result => {
    if (result.success) {
      console.log('\n✅ Manual test passed! Weather mapping feature is working.');
    } else {
      console.log('\n❌ Manual test failed. Check the migration and try again.');
    }
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { runManualTest }; 