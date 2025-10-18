import React, { useState, useCallback, useEffect, ReactElement } from 'react';

import Dropdown, { DropdownOption } from '../Dropdown';
import { Location } from '../../types';
import { classes } from '../../utils/misc';
import {
  GT_CAMPUS_CENTER,
  FALLBACK_GT_LOCATIONS,
} from '../../utils/mapbox/constants';

import './stylesheet.scss';

export interface LocationPickerProps {
  className?: string;
  placeholder?: string;
  value?: { where: string; location: Location | null } | null;
  onChange: (
    location: { where: string; location: Location | null } | null
  ) => void;
  onClear?: () => void;
  disabled?: boolean;
}

interface MapBoxGeometry {
  type: string;
  coordinates: [number, number];
}

interface MapBoxFeature {
  type: string;
  geometry: MapBoxGeometry;
  properties: Record<string, unknown>;
}

interface MapBoxRetrieveResponse {
  type: string;
  features: MapBoxFeature[];
}

interface MapBoxSuggestion {
  name: string;
  name_preferred?: string;
  mapbox_id: string;
  feature_type: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
  context?: {
    country?: {
      name: string;
      country_code: string;
      country_code_alpha_3: string;
    };
    region?: {
      name: string;
      region_code: string;
      region_code_full: string;
    };
    postcode?: {
      name: string;
    };
    district?: {
      name: string;
    };
    place?: {
      name: string;
    };
    locality?: {
      name: string;
    };
    neighborhood?: {
      name: string;
    };
    street?: {
      name: string;
    };
  };
  language?: string;
  maki?: string;
  poi_category?: string[];
  poi_category_ids?: string[];
  external_ids?: {
    foursquare?: string;
    facebook?: string;
  };
  metadata?: {
    primary_photo?: string[];
    other_photos?: string[];
  };
}

interface MapBoxSearchBoxResponse {
  suggestions: MapBoxSuggestion[];
  attribution: string;
}

export default function LocationPicker({
  className,
  placeholder = 'Add location',
  value,
  onChange,
  onClear,
  disabled = false,
}: LocationPickerProps): ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get MapBox access token from environment or use a fallback
  const MAPBOX_ACCESS_TOKEN = process.env['REACT_APP_MAPBOX_TOKEN'] || '';

  // Function to retrieve coordinates from MapBox using mapbox_id
  const retrieveCoordinates = useCallback(
    async (mapboxId: string): Promise<Location | null> => {
      try {
        // Correct MapBox Search Box API retrieve endpoint format
        const url = new URL(
          `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}`
        );
        url.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
        url.searchParams.set('session_token', `session_${Date.now()}`);

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as MapBoxRetrieveResponse;

        if (data.features && data.features[0] && data.features[0].geometry) {
          const coords = data.features[0].geometry.coordinates;
          const result = {
            lat: coords[1],
            long: coords[0],
          };
          return result;
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    [MAPBOX_ACCESS_TOKEN]
  );

  const searchLocations = useCallback(
    async (query: string): Promise<void> => {
      if (!query.trim()) {
        setOptions([]);
        return;
      }

      setIsLoading(true);

      // First, check if the query matches any GT locations
      const matchingGTLocations = FALLBACK_GT_LOCATIONS.filter((location) =>
        location.name.toLowerCase().includes(query.toLowerCase())
      );

      // Create fallback options from GT locations
      const fallbackOptions: DropdownOption[] = matchingGTLocations.map(
        (location) => ({
          key: `gt-${location.name}`,
          content: (
            <div className="location-option">
              <div className="location-name">{location.name}</div>
              <div className="location-address">{location.address}</div>
            </div>
          ),
          value: {
            where: `${location.name}, ${location.address}`,
            location: location.coords,
          },
        })
      );

      try {
        // Try MapBox Search Box API (correct format)
        const url = new URL(
          'https://api.mapbox.com/search/searchbox/v1/suggest'
        );
        url.searchParams.set('q', query);
        url.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
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

        // Sort results to prioritize Georgia Tech locations
        const sortedSuggestions = data.suggestions.sort((a, b) => {
          const aName = a.name || a.name_preferred || '';
          const aAddress =
            a.full_address || a.place_formatted || a.address || '';
          const aText = `${aName} ${aAddress}`.toLowerCase();

          const bName = b.name || b.name_preferred || '';
          const bAddress =
            b.full_address || b.place_formatted || b.address || '';
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

        // For Search Box API, we need a separate retrieve call for coordinates
        // Create options without coordinates and fetch them when selected
        const searchApiOptions: DropdownOption[] = sortedSuggestions.map(
          (suggestion) => {
            const name =
              suggestion.name || suggestion.name_preferred || 'Unknown';
            const address =
              suggestion.full_address ||
              suggestion.place_formatted ||
              suggestion.address ||
              `${suggestion.context?.locality?.name || ''}, ${
                suggestion.context?.region?.region_code || ''
              }`;

            return {
              key: suggestion.mapbox_id,
              content: (
                <div className="location-option">
                  <div className="location-name">{name}</div>
                  <div className="location-address">{address}</div>
                </div>
              ),
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
                const fallbackValue = fallback.value as {
                  where: string;
                  location: Location | null;
                };
                const optionValue = option.value as {
                  where: string;
                  location: Location | null;
                  mapbox_id?: string;
                };
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

        setOptions(combinedOptions);
      } catch (error) {
        // If MapBox fails, use fallback GT locations + error if no matches
        if (fallbackOptions.length > 0) {
          setOptions(fallbackOptions);
        } else {
          setOptions([
            {
              key: 'search-error',
              content: (
                <div className="location-option">
                  <div className="location-name">Search failed</div>
                  <div className="location-address">
                    Please try again or check your connection
                  </div>
                </div>
              ),
              value: null,
            },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [MAPBOX_ACCESS_TOKEN]
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

  const handleSearchChange = useCallback((newSearchTerm: string): void => {
    setSearchTerm(newSearchTerm);
  }, []);

  const handleSelect = useCallback(
    (option: DropdownOption): void => {
      // Don't allow selection of error options
      if (option.key === 'search-error' || option.value === null) {
        return;
      }

      const selectedValue = option.value as {
        where: string;
        location: Location | null;
        mapbox_id?: string;
      };

      // If this is a Search Box API result without coordinates, retrieve them
      if (selectedValue.mapbox_id && !selectedValue.location) {
        retrieveCoordinates(selectedValue.mapbox_id).then(
          (coordinates) => {
            const finalValue = {
              where: selectedValue.where,
              location: coordinates,
            };
            onChange(finalValue);
          },
          () => {
            // Fall back to selected value without coordinates
            onChange(selectedValue);
          }
        );
      } else {
        // This is either a GT fallback location or already has coordinates
        onChange(selectedValue);
      }

      setSearchTerm(''); // Clear search term after selection
    },
    [onChange, retrieveCoordinates]
  );

  const handleCustomLocation = useCallback((): void => {
    if (!searchTerm.trim()) {
      return;
    }

    // Create a custom location with no coordinates
    const customLocation = {
      where: searchTerm.trim(),
      location: null,
    };

    onChange(customLocation);
    setSearchTerm('');
  }, [searchTerm, onChange]);
  const handleClear = useCallback((): void => {
    setSearchTerm('');
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  return (
    <div className={classes('LocationPicker', className)}>
      <Dropdown
        placeholder={placeholder}
        value={value?.where ? value.where.split(',')[0] : undefined}
        options={options}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSelect={handleSelect}
        onClear={handleClear}
        isLoading={isLoading}
        disabled={disabled}
        onCustomLocation={handleCustomLocation}
      />
    </div>
  );
}
