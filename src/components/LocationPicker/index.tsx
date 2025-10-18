import React, { useCallback, useMemo, ReactElement } from 'react';

import Dropdown, { DropdownOption } from '../Dropdown';
import { Location } from '../../types';
import { classes } from '../../utils/misc';
import { retrieveCoordinates } from '../../utils/mapbox';
import { useLocationSearch } from './useLocationSearch';

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
  // Get MapBox access token from environment or use a fallback
  const MAPBOX_ACCESS_TOKEN = process.env['REACT_APP_MAPBOX_TOKEN'] || '';

  const { searchTerm, optionsData, isLoading, setSearchTerm } =
    useLocationSearch(MAPBOX_ACCESS_TOKEN);

  // Convert optionsData to Dropdown options with React elements
  const options: DropdownOption[] = useMemo(
    () =>
      optionsData.map((optionData) => ({
        key: optionData.key,
        content: (
          <div className="location-option">
            <div className="location-name">{optionData.locationName}</div>
            <div className="location-address">{optionData.locationAddress}</div>
          </div>
        ),
        value: optionData.value,
      })),
    [optionsData]
  );

  const handleSearchChange = useCallback(
    (newSearchTerm: string): void => {
      setSearchTerm(newSearchTerm);
    },
    [setSearchTerm]
  );

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
    [onChange, MAPBOX_ACCESS_TOKEN, setSearchTerm]
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
  }, [searchTerm, onChange, setSearchTerm]);
  const handleClear = useCallback((): void => {
    setSearchTerm('');
    if (onClear) {
      onClear();
    }
  }, [onClear, setSearchTerm]);

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
