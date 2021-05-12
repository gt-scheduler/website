import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCaretDown,
  faEdit,
  faPlus,
  faTrashAlt,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { classes } from '../../utils';
import { Button } from '..';
import './stylesheet.scss';

// General <Select /> component for all select drop down.
// Each option in <Select /> takes in its identifier(optionId),
// its text(optionLabel), its onClick, its related icons
// and their corresponding functions. Each icon's display
// (before or after the text, when to display),
// picture have to be specified within this component.
export default function Select({
  className,
  value,
  options,
  desiredItemWidth = null
}) {
  const [opened, setOpened] = useState(false);
  const [inputId, setInputId] = useState('');
  const [inputting, setInputting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentId, setcurrentId] = useState(value);

  useEffect(() => {
    setcurrentId(value);
  }, [value]);

  useEffect(() => {
    setOpened(inputting);
  }, [inputting]);

  const optionsObtained = options;
  const selectedOption = optionsObtained.find(
    (option) => option.optionId === currentId
  );
  const label = selectedOption ? selectedOption.optionLabel : '-';
  const handleInputChange = (e) => {
    const input = e.target.value.trim();
    setInputValue(`${input}`);
  };
  const handleKeyDown = (optionLabel, iconsAndFunctions, index, e) => {
    if (e.key === 'Enter') {
      if (inputValue === '') {
        setInputValue('Blank');
      }
      if (iconsAndFunctions.functions.edit(inputValue)) {
        setcurrentId(optionLabel === currentId ? inputValue : currentId);
        optionsObtained[index].optionLabel = inputValue;
      }
      setInputting(false);
      setInputId('');
    }
  };

  return (
    <div
      className={classes('Button', 'Select', className)}
      onClick={() => (!inputting ? setOpened(!opened) : setOpened(true))}
    >
      <div className="text">{label}</div>
      <FontAwesomeIcon fixedWidth icon={faCaretDown} />
      {opened && (
        <div
          className="intercept"
          onClick={() => (!inputting ? setOpened(false) : setOpened(true))}
        />
      )}
      {opened && (
        <div
          className="option-container"
          style={desiredItemWidth != null ? { width: desiredItemWidth } : {}}
        >
          {optionsObtained.map(
            (
              {
                optionId,
                optionLabel,
                onClick,
                iconsAndFunctions = { icons: [], functions: {} }
              },
              index
            ) => (
              <div
                className={classes(
                  'option',
                  optionId === inputId && 'option-inputting'
                )}
                key={optionId + optionLabel}
              >
                {inputting && inputId === optionId ? (
                  <input
                    /* eslint-disable-next-line jsx-a11y/no-autofocus */
                    autoFocus
                    className="option-input"
                    type="text"
                    key={`input${optionLabel}`}
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={optionLabel}
                    onKeyDown={(e) => {
                      handleKeyDown(optionLabel, iconsAndFunctions, index, e);
                    }}
                  />
                ) : (
                  <Button
                    className="option-text"
                    key={optionId}
                    onClick={() => onClick(optionId)}
                  >
                    {iconsAndFunctions.icons.includes('add') ? (
                      <FontAwesomeIcon fixedWidth icon={faPlus} />
                    ) : null}
                    {optionLabel}
                  </Button>
                )}
                {iconsAndFunctions.icons.includes('edit') ? (
                  <Button
                    key={`${optionLabel}edit`}
                    className="option-button"
                    onClick={(e) => {
                      if (optionId === inputId) {
                        if (inputValue === '') {
                          setInputValue('Blank');
                        }
                        if (iconsAndFunctions.functions.edit(inputValue)) {
                          setcurrentId(
                            optionLabel === currentId ? inputValue : currentId
                          );
                          optionsObtained[index].optionLabel = inputValue;
                        }
                        setInputting(false);
                        setInputId('');
                      } else {
                        setInputValue(optionLabel);
                        setInputting(true);
                        setInputId(optionId);
                        e.stopPropagation();
                      }
                    }}
                  >
                    <FontAwesomeIcon
                      fixedWidth
                      icon={
                        inputting && optionId === inputId ? faCheck : faEdit
                      }
                    />
                  </Button>
                ) : null}
                {iconsAndFunctions.icons.includes('delete') ? (
                  <Button
                    key={`${optionLabel}delete`}
                    className="option-button"
                    onClick={() => {
                      if (inputting) {
                        setInputting(false);
                      }
                      iconsAndFunctions.functions.delete();
                    }}
                  >
                    <FontAwesomeIcon fixedWidth icon={faTrashAlt} />
                  </Button>
                ) : null}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
