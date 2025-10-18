import { Location } from '../../types';
import { GT_CAMPUS_CENTER } from './constants';
import {
  MapBoxRetrieveResponse,
  MapBoxSearchBoxResponse,
  MapBoxSuggestion,
} from './types';

/**
 * Retrieve coordinates from MapBox using mapbox_id
 */
export async function retrieveCoordinates(
  mapboxId: string,
  accessToken: string
): Promise<Location | null> {
  try {
    const url = new URL(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}`
    );
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('session_token', `session_${Date.now()}`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as MapBoxRetrieveResponse;

    if (data.features && data.features[0] && data.features[0].geometry) {
      const coords = data.features[0].geometry.coordinates;
      return {
        lat: coords[1],
        long: coords[0],
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Search MapBox API for location suggestions
 */
export async function searchMapBoxLocations(
  query: string,
  accessToken: string
): Promise<MapBoxSuggestion[]> {
  const url = new URL('https://api.mapbox.com/search/searchbox/v1/suggest');
  url.searchParams.set('q', query);
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('session_token', `session_${Date.now()}`);
  url.searchParams.set(
    'proximity',
    `${GT_CAMPUS_CENTER.longitude},${GT_CAMPUS_CENTER.latitude}`
  );
  url.searchParams.set('country', 'US');
  url.searchParams.set('limit', '10');
  url.searchParams.set('language', 'en');
  url.searchParams.set('types', 'poi,address,place');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as MapBoxSearchBoxResponse;
  return data.suggestions;
}
