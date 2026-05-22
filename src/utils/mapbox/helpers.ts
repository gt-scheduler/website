import { Location } from '../../types';

export interface MapboxMatrixResponse {
  code: string;
  durations: number[][];
  distances: number[][];
  destinations: Array<{
    name: string;
    location: [number, number];
  }>;
  sources: Array<{
    name: string;
    location: [number, number];
  }>;
}

export interface MapboxDirectionsResponse {
  code: string;
  routes: Array<{
    duration: number;
    distance: number;
    legs: Array<{
      duration: number;
      distance: number;
    }>;
  }>;
}

export function createLocationKey(loc1: Location, loc2: Location): string {
  return `${loc1.lat},${loc1.long}|${loc2.lat},${loc2.long}`;
}

// Helper function to call Mapbox Directions API for single pair lookups
export async function callMapboxDirectionsAPI(
  from: Location,
  to: Location,
  profile = 'mapbox/walking'
): Promise<number | null> {
  const MAPBOX_ACCESS_TOKEN = process.env['REACT_APP_MAPBOX_TOKEN'];

  if (!MAPBOX_ACCESS_TOKEN) {
    throw new Error('Mapbox access token not found in environment variables');
  }

  // Format coordinates for Directions API (longitude,latitude)
  const coordinateString = `${from.long},${from.lat};${to.long},${to.lat}`;

  const url = new URL(
    `https://api.mapbox.com/directions/v5/${profile}/${coordinateString}`
  );
  url.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
  url.searchParams.set('annotations', 'duration');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `Mapbox Directions API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as MapboxDirectionsResponse;

  if (data.code !== 'Ok') {
    throw new Error(`Mapbox Directions API returned error code: ${data.code}`);
  }

  // Extract duration from the first route's first leg
  const duration = data.routes?.[0]?.duration;
  return duration !== undefined ? duration : null;
}

export function areLocationsEqual(loc1: Location, loc2: Location): boolean {
  return loc1.lat === loc2.lat && loc1.long === loc2.long;
}

export function isValidLocation(location: Location): boolean {
  return (
    typeof location.lat === 'number' &&
    typeof location.long === 'number' &&
    !Number.isNaN(location.lat) &&
    !Number.isNaN(location.long) &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    location.long >= -180 &&
    location.long <= 180
  );
}
