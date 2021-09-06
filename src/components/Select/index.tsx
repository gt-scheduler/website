import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';

import { classes } from '../../utils';
import { Button } from '..';
import Spinner from '../Spinner';

import './stylesheet.scss';

export type SelectProps<V extends string | number> = {
  className?: string;
  value: V;
  onChange: (newValue: V) => void;
  options: SelectOption<V>[];
};

export type SelectOption<V> = {
  value: V;
  label: React.ReactNode;
};

export default function Select<V extends string | number>({
  className,
  value,
  onChange,
  options,
}: SelectProps<V>): React.ReactElement {
  const [opened, setOpened] = useState(false);

  const selectedOption = options.find((option) => option.value === value);
  const label = selectedOption ? selectedOption.label : '-';

  return (
    <div
      className={classes('Button', 'Select', className)}
      onClick={(): void => setOpened(!opened)}
    >
      <div className="text">{label}</div>
      <FontAwesomeIcon fixedWidth icon={faCaretDown} />
      {opened && (
        <div className="intercept" onClick={(): void => setOpened(false)} />
      )}
      {opened && (
        <div className="option-container">
          {options.map(({ value: optionValue, label: optionLabel }) => (
            <Button
              className="option"
              key={optionValue}
              onClick={(): void => onChange(optionValue)}
            >
              {optionLabel}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export type LoadingSelectProps = {
  className?: string;
  label?: string;
};

export function LoadingSelect({
  className,
  label = 'Loading',
}: LoadingSelectProps): React.ReactElement {
  return (
    <div className={classes('Button', 'Select', className, 'disabled')}>
      <Spinner size="small" style={{ marginRight: 12 }} />
      <div className="text">{label}</div>
      <FontAwesomeIcon fixedWidth icon={faCaretDown} />
    </div>
  );
}
