import React, { useState, useCallback, useEffect, ReactElement } from 'react';

import Dropdown, { DropdownOption } from '../Dropdown';
import { Location } from '../../types';
import { classes } from '../../utils/misc';
import {
  retrieveCoordinates,
  searchMapBoxLocations,
  filterGTLocations,
  sortByGTPriority,
  formatLocationFromSuggestion,
} from '../../utils/mapbox';

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

  const searchLocations = useCallback(
    async (query: string): Promise<void> => {
      if (!query.trim()) {
        setOptions([]);
        return;
      }

      setIsLoading(true);

      // First, check if the query matches any GT locations
      const matchingGTLocations = filterGTLocations(query);

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
        // Try MapBox Search Box API
        const suggestions = await searchMapBoxLocations(
          query,
          MAPBOX_ACCESS_TOKEN
        );

        // Sort results to prioritize Georgia Tech locations
        const sortedSuggestions = sortByGTPriority(suggestions);

        // Create options without coordinates and fetch them when selected
        const searchApiOptions: DropdownOption[] = sortedSuggestions.map(
          (suggestion) => {
            const { name, address } = formatLocationFromSuggestion(suggestion);

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
        retrieveCoordinates(selectedValue.mapbox_id, MAPBOX_ACCESS_TOKEN).then(
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
    [onChange, MAPBOX_ACCESS_TOKEN]
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
