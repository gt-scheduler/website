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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const displayValue = value && !isOpen ? String(value) : searchTerm;

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
            <div className="dropdown-no-results">No results found</div>
          ) : (
            options.map((option, index) => (
              <div
                key={option.key}
                ref={(el): void => {
                  optionRefs.current[index] = el;
                }}
                className={classes(
                  'dropdown-option',
                  index === focusedIndex && 'focused'
                )}
                onClick={(): void => handleSelect(option)}
                onMouseEnter={(): void => setFocusedIndex(index)}
              >
                {option.content}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
