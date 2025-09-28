import React, { useState, useCallback, useEffect, ReactElement } from 'react';

import Dropdown, { DropdownOption } from '../Dropdown';
import { Location } from '../../types';
import { classes } from '../../utils/misc';

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

// Georgia Tech campus coordinates for proximity bias
const GT_CAMPUS_CENTER = {
  longitude: -84.3963,
  latitude: 33.7756,
};

// Fallback GT locations with coordinates - SINGLE SOURCE OF TRUTH
const FALLBACK_GT_LOCATIONS = [
  {
    name: 'Skiles',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.773568, long: -84.395957 },
  },
  {
    name: 'Clough Commons',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.774909, long: -84.396404 },
  },
  {
    name: 'Clough UG Learning Commons',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.774909, long: -84.396404 },
  },
  {
    name: 'Boggs',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776085, long: -84.400181 },
  },
  {
    name: 'Architecture (West)',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776076, long: -84.396114 },
  },
  {
    name: 'West Architecture',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776076, long: -84.396114 },
  },
  {
    name: 'Architecture (East)',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776177, long: -84.395459 },
  },
  {
    name: 'East Architecture',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776177, long: -84.395459 },
  },
  {
    name: 'Scheller College of Business',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776533, long: -84.387765 },
  },
  {
    name: 'Guggenheim Aerospace',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.771771, long: -84.395796 },
  },
  {
    name: 'Van Leer',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776065, long: -84.397116 },
  },
  {
    name: 'Bunger-Henry',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775803, long: -84.398189 },
  },
  {
    name: 'Coll of Computing',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777576, long: -84.397352 },
  },
  {
    name: 'College of Computing',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777576, long: -84.397352 },
  },
  {
    name: 'Weber SST III',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.772949, long: -84.396066 },
  },
  {
    name: 'Engr Science & Mech',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.772114, long: -84.395289 },
  },
  {
    name: 'Engineering Sci and Mechanics',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.772114, long: -84.395289 },
  },
  {
    name: 'Mason',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776764, long: -84.39844 },
  },
  {
    name: 'Love (MRDC II)',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77672, long: -84.401764 },
  },
  {
    name: 'J. Erskine Love Manufacturing',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77672, long: -84.401764 },
  },
  {
    name: 'MRDC',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777187, long: -84.400484 },
  },
  {
    name: 'Manufacture Rel Discip Complex',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777187, long: -84.400484 },
  },
  {
    name: 'Allen Sustainable Education',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77622, long: -84.397959 },
  },
  {
    name: 'Howey (Physics)',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777622, long: -84.398785 },
  },
  {
    name: 'Instr Center',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775587, long: -84.401213 },
  },
  {
    name: 'Instructional Center',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775587, long: -84.401213 },
  },
  {
    name: "O'Keefe",
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779177, long: -84.392196 },
  },
  {
    name: 'Curran Street Deck',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779495, long: -84.405633 },
  },
  {
    name: 'D. M. Smith',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.773801, long: -84.395122 },
  },
  {
    name: 'Swann',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.771658, long: -84.395302 },
  },
  {
    name: 'Kendeda',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.778759, long: -84.399597 },
  },
  {
    name: 'Ford Environmental Sci & Tech',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779004, long: -84.395849 },
  },
  {
    name: 'Klaus Advanced Computing Building',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777107, long: -84.395817 },
  },
  {
    name: 'Cherry Emerson',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.778011, long: -84.397065 },
  },
  {
    name: 'U A Whitaker Biomedical Engr',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.778513, long: -84.396825 },
  },
  {
    name: 'Whitaker',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.778513, long: -84.396825 },
  },
  {
    name: 'Molecular Sciences & Engr',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779836, long: -84.396666 },
  },
  {
    name: '760 Spring Street',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77561, long: -84.38906 },
  },
  {
    name: 'Paper Tricentennial',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.780983, long: -84.404516 },
  },
  {
    name: 'Daniel Lab',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.773714, long: -84.394047 },
  },
  {
    name: 'Pettit MiRC',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776532, long: -84.397307 },
  },
  {
    name: 'Centergy',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777062, long: -84.388997 },
  },
  {
    name: 'Stephen C Hall',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.774134, long: -84.39396 },
  },
  {
    name: 'Brittain T Room',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77247, long: -84.391271 },
  },
  {
    name: 'Hefner Dormitory(HEF)',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779159, long: -84.403952 },
  },
  {
    name: 'Old Civil Engr',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7742, long: -84.394637 },
  },
  {
    name: 'West Village Dining Commons',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779564, long: -84.404718 },
  },
  {
    name: 'Couch',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.778233, long: -84.404507 },
  },
  {
    name: 'J. S. Coon',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77258, long: -84.395624 },
  },
  {
    name: '575 Fourteenth Street',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.786914, long: -84.406213 },
  },
  {
    name: 'Groseclose',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775778, long: -84.401885 },
  },
  {
    name: 'Theater for the Arts',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775041, long: -84.399287 },
  },
  {
    name: 'Habersham',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.773978, long: -84.404311 },
  },
  {
    name: 'Savant',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.772075, long: -84.395277 },
  },
  {
    name: 'ISyE Main',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775178, long: -84.401879 },
  },
  {
    name: 'Fourth Street Houses',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775381, long: -84.391451 },
  },
  {
    name: 'Rich-Computer Center',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77535159008218, long: -84.39513500282604 },
  },
  {
    name: 'Student Center',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7738, long: -84.397 },
  },
  {
    name: 'Campus Recreation Center',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7766, long: -84.4048 },
  },
  {
    name: 'Tech Tower',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7756, long: -84.3963 },
  },
  {
    name: 'McCamish Pavilion',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7805, long: -84.3921 },
  },
  {
    name: 'Bobby Dodd Stadium',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7723, long: -84.3922 },
  },
];

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
      />
    </div>
  );
}
