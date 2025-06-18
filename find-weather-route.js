import fetch from 'node-fetch';
import { lineString, booleanIntersects } from '@turf/turf';
import { readFileSync } from 'fs';

// Hardcoded airport coords as in API route
const airportCoords = {
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

async function fetchSigmets() {
  const url = 'https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=sigmets&requestType=retrieve&format=geojson&hoursBeforeNow=3';
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

async function main() {
  const sigmetData = await fetchSigmets();
  const airports = Object.keys(airportCoords);
  let bestPairs = [];
  for (let i = 0; i < airports.length; i++) {
    for (let j = i + 1; j < airports.length; j++) {
      const a = airports[i];
      const b = airports[j];
      const path = lineString([airportCoords[a], airportCoords[b]]);
      const intersects = sigmetData.features.some(feat => booleanIntersects(path, feat));
      if (intersects) {
        bestPairs.push([a, b]);
      }
    }
  }
  console.log('Pairs intersecting weather:', bestPairs);
}

main(); 