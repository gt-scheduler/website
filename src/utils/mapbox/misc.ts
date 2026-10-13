import { FALLBACK_GT_LOCATIONS, GT_DISTANCE_MATRIX } from './constants';
import { GTLocation, MapBoxSuggestion } from './types';
import { Location } from '../../types';

/**
 * Filter GT locations based on search query
 */
export function filterGTLocations(query: string): GTLocation[] {
  return FALLBACK_GT_LOCATIONS.filter((location) =>
    location.name.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Sort MapBox suggestions to prioritize Georgia Tech locations
 */
export function sortByGTPriority(
  suggestions: MapBoxSuggestion[]
): MapBoxSuggestion[] {
  return suggestions.sort((a, b) => {
    const aName = a.name || a.name_preferred || '';
    const aAddress = a.full_address || a.place_formatted || a.address || '';
    const aText = `${aName} ${aAddress}`.toLowerCase();

    const bName = b.name || b.name_preferred || '';
    const bAddress = b.full_address || b.place_formatted || b.address || '';
    const bText = `${bName} ${bAddress}`.toLowerCase();

    // Check if the suggestion contains any GT location names or keywords
    const gtKeywords = [
      'georgia tech',
      'georgia institute of technology',
      'gt',
      ...FALLBACK_GT_LOCATIONS.flatMap((loc) => [
        loc.name.toLowerCase(),
        // Extract key words from location names
        ...loc.name
          .toLowerCase()
          .split(/[\s()&-]+/)
          .filter((word) => word.length > 2),
      ]),
    ];

    const aIsGT = gtKeywords.some((keyword) => aText.includes(keyword));
    const bIsGT = gtKeywords.some((keyword) => bText.includes(keyword));

    if (aIsGT && !bIsGT) return -1;
    if (!aIsGT && bIsGT) return 1;
    return 0; // Keep original order for non-GT locations
  });
}

/**
 * Format location name and address from MapBox suggestion
 */
export function formatLocationFromSuggestion(suggestion: MapBoxSuggestion): {
  name: string;
  address: string;
} {
  const name = suggestion.name || suggestion.name_preferred || 'Unknown';
  const address =
    suggestion.full_address ||
    suggestion.place_formatted ||
    suggestion.address ||
    `${suggestion.context?.locality?.name || ''}, ${
      suggestion.context?.region?.region_code || ''
    }`;

  return { name, address };
}

// Helper function to find GT location by coordinates (with tolerance)
export function findGTLocationByCoords(
  coords: Location,
  tolerance = 0.0001
): GTLocation | null {
  return (
    FALLBACK_GT_LOCATIONS.find(
      (location) =>
        Math.abs(location.coords.lat - coords.lat) < tolerance &&
        Math.abs(location.coords.long - coords.long) < tolerance
    ) || null
  );
}

export function getTravel(from: Location | null, to: Location | null): number {
  if (!from || !to) return 0;

  const fromLoc = findGTLocationByCoords(from);
  const toLoc = findGTLocationByCoords(to);
  if (!fromLoc || !toLoc) return 0;

  const key = `${fromLoc.coords.lat},${fromLoc.coords.long}|${toLoc.coords.lat},${toLoc.coords.long}`;

  return GT_DISTANCE_MATRIX[key] ?? 0;
}
