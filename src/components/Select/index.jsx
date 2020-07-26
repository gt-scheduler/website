import React, { useState } from 'react';
import { classes } from '../../utils';
import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons/faCaretDown';
import { Button } from '../';

export function Select({ className, value, onChange, options }) {
  const [opened, setOpened] = useState(false);

  const selectedOption = options.find(option => option.value === value);
  const label = selectedOption ? selectedOption.label : '-';

  return (
    <div className={classes('Button', 'Select', className)} onClick={() => setOpened(!opened)}>
      <div className="text">
        {label}
      </div>
      <FontAwesomeIcon fixedWidth icon={faCaretDown}/>
      {
        opened &&
        <div className="intercept" onClick={() => setOpened(false)}/>
      }
      {
        opened &&
        <div className="option-container">
          {
            options.map(({ value, label }) => (
              <Button className="option" key={value} onClick={() => onChange(value)}>
                {label}
              </Button>
            ))
          }
        </div>
      }
    </div>
  );
}
