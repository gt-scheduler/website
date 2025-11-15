import React, { useState, useEffect, useRef } from 'react';

import './stylesheet.scss';

type Option = {
  id: string;
  shortLabel: string;
  longLabel?: React.ReactNode;
};

type DropdownInputProps = {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  searchable?: boolean;
};

export default function DropdownInput({
  options,
  value,
  onChange,
  placeholder = 'Select',
  searchable = false,
}: DropdownInputProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [visibleOptions, setVisibleOptions] = useState<Option[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loweredQuery = searchable ? query.toLowerCase() : '';

    const filtered = searchable
      ? options.filter((opt) =>
          opt.shortLabel.toLowerCase().includes(loweredQuery)
        )
      : options;

    setVisibleOptions(filtered.slice(0, 10));
  }, [options, query, searchable]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: Option): void => {
    onChange(option.id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div
      className="dropdown-input"
      ref={containerRef}
      onFocus={(): void => setOpen(true)}
      onBlur={(e): void => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false);
          setQuery('');
        }
      }}
    >
      <div className="input-box">
        {searchable ? (
          <input
            type="text"
            value={open ? query : value}
            placeholder={placeholder}
            onFocus={(): void => {
              setOpen(true);
              setQuery('');
            }}
            onChange={(e): void => setQuery(e.target.value)}
          />
        ) : (
          <div
            className="text"
            onMouseDown={(e): void => {
              e.preventDefault();
              setOpen(true);
            }}
          >
            {value || placeholder}
          </div>
        )}
      </div>

      {open && (
        <div className="options">
          {visibleOptions.length === 0 ? (
            <div className="option disabled">No Results</div>
          ) : (
            visibleOptions.map((opt, idx) => (
              <div
                key={idx}
                className="option"
                onMouseDown={(e): void => e.preventDefault()}
                onClick={(): void => handleSelect(opt)}
              >
                {opt.longLabel ?? opt.shortLabel}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
