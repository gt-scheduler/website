import { useState, useCallback, useEffect } from 'react';

import { Location } from '../../types';
import {
  searchMapBoxLocations,
  filterGTLocations,
  sortByGTPriority,
  formatLocationFromSuggestion,
} from '../../utils/mapbox';

export interface LocationOptionData {
  key: string;
  locationName: string;
  locationAddress: string;
  value: {
    where: string;
    location: Location | null;
    mapbox_id?: string;
  } | null;
}

interface UseLocationSearchResult {
  searchTerm: string;
  optionsData: LocationOptionData[];
  isLoading: boolean;
  setSearchTerm: (term: string) => void;
}

export function useLocationSearch(
  mapboxAccessToken: string
): UseLocationSearchResult {
  const [searchTerm, setSearchTerm] = useState('');
  const [optionsData, setOptionsData] = useState<LocationOptionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchLocations = useCallback(
    async (query: string): Promise<void> => {
      if (!query.trim()) {
        setOptionsData([]);
        return;
      }

      setIsLoading(true);

      // First, check if the query matches any GT locations
      const matchingGTLocations = filterGTLocations(query);

      // Create fallback options from GT locations
      const fallbackOptions: LocationOptionData[] = matchingGTLocations.map(
        (location) => ({
          key: `gt-${location.name}`,
          locationName: location.name,
          locationAddress: location.address,
          value: {
            where: `${location.name}, ${location.address}`,
            location: location.coords,
          },
        })
      );

      try {
        // Try MapBox Search Box API
        const suggestions = await searchMapBoxLocations(
          query,
          mapboxAccessToken
        );

        // Sort results to prioritize Georgia Tech locations
        const sortedSuggestions = sortByGTPriority(suggestions);

        // Create options without coordinates and fetch them when selected
        const searchApiOptions: LocationOptionData[] = sortedSuggestions.map(
          (suggestion) => {
            const { name, address } = formatLocationFromSuggestion(suggestion);

            return {
              key: suggestion.mapbox_id,
              locationName: name,
              locationAddress: address,
              value: {
                where: `${name}${address ? `, ${address}` : ''}`,
                location: null, // Will be fetched when selected
                mapbox_id: suggestion.mapbox_id, // Store for coordinate retrieval
              },
            };
          }
        );

        // Combine GT locations first, then Search API results (avoid dupes)
        const combinedOptions = [
          ...fallbackOptions,
          ...searchApiOptions.filter(
            (option) =>
              !fallbackOptions.some((fallback) => {
                const fallbackValue = fallback.value;
                const optionValue = option.value;
                if (!fallbackValue || !optionValue) return false;
                const fallbackName =
                  fallbackValue.where?.split(',')[0]?.toLowerCase() || '';
                const optionName =
                  optionValue.where?.split(',')[0]?.toLowerCase() || '';
                return (
                  fallbackName.includes(optionName) ||
                  optionName.includes(fallbackName)
                );
              })
          ),
        ];

        setOptionsData(combinedOptions);
      } catch (error) {
        // If MapBox fails, use fallback GT locations + error if no matches
        if (fallbackOptions.length > 0) {
          setOptionsData(fallbackOptions);
        } else {
          setOptionsData([
            {
              key: 'search-error',
              locationName: 'Search failed',
              locationAddress: 'Please try again or check your connection',
              value: null,
            },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [mapboxAccessToken]
  );

  // Debounce search requests
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLocations(searchTerm).catch(() => {
        // Silently handle search errors
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchLocations]);

  return {
    searchTerm,
    optionsData,
    isLoading,
    setSearchTerm,
  };
}
