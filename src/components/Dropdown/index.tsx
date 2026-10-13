import React, { useState, useRef, useEffect, ReactElement } from 'react';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export interface DropdownOption {
  key: string;
  content: ReactElement;
  value: unknown;
}

export interface DropdownProps {
  className?: string;
  placeholder?: string;
  value?: unknown;
  options: DropdownOption[];
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  onSelect: (option: DropdownOption) => void;
  onClear?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  onCustomLocation?: () => void;
}

export default function Dropdown({
  className,
  placeholder = 'Search...',
  value,
  options,
  searchTerm,
  onSearchChange,
  onSelect,
  onClear,
  isLoading = false,
  disabled = false,
  onCustomLocation,
}: DropdownProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [focusedIndex]);

  // Reset option refs when options change
  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, options.length);
  }, [options]);

  const handleBlur = (): void => {
    // pls dont edit this set timeout everything breaks
    setTimeout(() => {
      setIsOpen(false);
      setFocusedIndex(-1);
    }, 200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    onSearchChange(newValue);
    if (!isOpen) {
      setIsOpen(true);
    }
    setFocusedIndex(-1);
  };

  const handleInputFocus = (): void => {
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (
          focusedIndex >= 0 &&
          focusedIndex < options.length &&
          options[focusedIndex]
        ) {
          const selectedOption = options[focusedIndex];
          if (selectedOption) {
            handleSelect(selectedOption);
          }
        } else if (searchTerm.trim() && onCustomLocation) {
          // No option is focused and there's a search term, use custom location
          onCustomLocation();
          setIsOpen(false);
          setFocusedIndex(-1);
          inputRef.current?.blur();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleSelect = (option: DropdownOption): void => {
    onSelect(option);
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = (): void => {
    if (onClear) {
      onClear();
    }
    onSearchChange('');
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const displayValue =
    value && !isOpen && typeof value === 'string' ? value : searchTerm;

  return (
    <div className={classes('Dropdown', className)} ref={dropdownRef}>
      <div className="dropdown-input-container">
        <input
          ref={inputRef}
          type="text"
          className="dropdown-input"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        {(value || searchTerm) && onClear && (
          <button
            type="button"
            className="dropdown-clear"
            onClick={handleClear}
            disabled={disabled}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {isLoading ? (
            <div className="dropdown-loading">Loading...</div>
          ) : !searchTerm.trim() ? (
            <div className="dropdown-prompt">Start typing...</div>
          ) : options.length === 0 ? (
            <div className="dropdown-custom-option-container">
              {onCustomLocation && (
                <div
                  className="dropdown-custom-option"
                  onMouseDown={(e): void => {
                    e.preventDefault(); // Prevent input blur
                    onCustomLocation();
                    setIsOpen(false);
                    setFocusedIndex(-1);
                  }}
                >
                  Use &quot;{searchTerm}&quot; as custom location
                </div>
              )}
              <div className="dropdown-no-results">No results found</div>
            </div>
          ) : (
            <>
              {onCustomLocation && searchTerm.trim() && (
                <div
                  className="dropdown-custom-option"
                  onMouseDown={(e): void => {
                    e.preventDefault(); // Prevent input blur
                    onCustomLocation();
                    setIsOpen(false);
                    setFocusedIndex(-1);
                  }}
                >
                  Use &quot;{searchTerm}&quot; as custom location
                </div>
              )}
              {options.map((option, index) => (
                <div
                  key={option.key}
                  ref={(el): void => {
                    optionRefs.current[index] = el;
                  }}
                  className={classes(
                    'dropdown-option',
                    index === focusedIndex && 'focused'
                  )}
                  onMouseDown={(e): void => {
                    e.preventDefault(); // Prevent input blur
                    handleSelect(option);
                  }}
                  onMouseEnter={(): void => setFocusedIndex(index)}
                >
                  {option.content}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
