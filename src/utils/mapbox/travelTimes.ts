import { Location } from '../../types';
import { GT_DISTANCE_MATRIX, findGTLocationByCoords } from '../../mapConstants';
import {
  callMapboxDirectionsAPI,
  createLocationKey,
  isValidLocation,
  areLocationsEqual,
} from './helpers';

/**
 * Get distance between two locations, checking pre-computed matrix first,
 * then falling back to Mapbox Directions API if needed
 */
export async function getDistanceBetweenLocations(
  loc1: Location,
  loc2: Location
): Promise<number | null> {
  // Validate inputs
  if (!isValidLocation(loc1) || !isValidLocation(loc2)) {
    return null;
  }

  // If locations are the same, return 0
  if (areLocationsEqual(loc1, loc2)) {
    return 0;
  }

  // Check if both locations are GT locations in our pre-computed matrix
  const gtLoc1 = findGTLocationByCoords(loc1);
  const gtLoc2 = findGTLocationByCoords(loc2);

  if (gtLoc1 && gtLoc2) {
    const key = createLocationKey(loc1, loc2);
    const duration = GT_DISTANCE_MATRIX[key];

    if (duration !== undefined) {
      return duration;
    }
  }

  // Fallback to Mapbox Directions API for custom locations
  try {
    const duration = await callMapboxDirectionsAPI(
      loc1,
      loc2,
      'mapbox/walking'
    );
    return duration;
  } catch (error) {
    return null;
  }
}

/**
 * Batch get distances between consecutive locations in chronological order
 * Returns a map of location pair keys to durations in seconds
 */
export async function batchGetDistances(
  locations: Location[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>();

  if (locations.length < 2) {
    return result;
  }

  // Process consecutive pairs
  for (let i = 0; i < locations.length - 1; i++) {
    const loc1 = locations[i];
    const loc2 = locations[i + 1];

    if (loc1 && loc2) {
      const key = createLocationKey(loc1, loc2);

      if (!result.has(key)) {
        const duration = await getDistanceBetweenLocations(loc1, loc2);

        if (duration !== null) {
          result.set(key, duration);
        }
      }
    }
  }

  return result;
}

export {
  createLocationKey,
  isValidLocation,
  areLocationsEqual,
} from './helpers';
