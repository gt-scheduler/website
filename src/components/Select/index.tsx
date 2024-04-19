import React, { useEffect, useRef, useState } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCaretDown,
  faCheck,
  faPlus,
  faTimes,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

import { classes } from '../../utils/misc';
import { Button } from '..';
import Spinner from '../Spinner';

import './stylesheet.scss';

export type SelectProps<Id extends string | number> = {
  className?: string;
  style?: React.CSSProperties;
  menuAnchor?: 'left' | 'right';
  current: Id;
  onChange: (newId: Id) => void;
  options: SelectOption<Id>[];
  desiredItemWidth?: number | string | null;

  // If this is provided, then an explicit "New" option is added
  // to the bottom of the <Select> box
  // that will invoke this callback when clicked.
  onClickNew?: () => void;

  // Ignored if `onClickNew` is not provided.
  newLabel?: string;
  id?: string;
};

export interface SelectOption<Id extends string | number> {
  id: Id;
  label: string;

  // Used to specify any inline actions (buttons)
  // These are visible when hovering the option on desktop,
  // and are always visible on mobile.
  actions?: SelectAction<Id>[];
}

export type SelectAction<Id extends string | number> =
  | EditAction<Id>
  | ButtonAction<Id>;

/**
 * Action that, when clicked on, initiates inline editing.
 * Once the user commits the edit (either by pressing 'Enter'
 * or by clicking the checkbox that this action's icon is replaced with),
 * then the `onCommit` callback is invoked,
 * which gives the action the opportunity:
 * to accept the edit (by updating the item's label and returning true)
 * or reject it (by returning false).
 * If the edit is rejected, then the <Select> box remains in edit mode.
 */
export interface EditAction<Id extends string | number> {
  type: 'edit';
  icon: IconDefinition;
  onCommit: (newLabel: string, id: Id) => boolean;
  id?: string;
  tooltip?: string;
}

/**
 * Basic action that, when clicked on, invokes the specified `onClick` callback
 */
export interface ButtonAction<Id extends string | number> {
  type: 'button';
  icon: IconDefinition;
  onClick: (id: Id) => void;
  id?: string;
  tooltip?: string;
}

/**
 * Renders a combo box-style input element that can be used
 * to select an option from a small group of options,
 * where only a single selected item can be active.
 * Supports per-option actions, inline label editing,
 * and a "New" option that appears at the bottom of the drop-down list.
 */
export default function Select<Id extends string | number>({
  className,
  style,
  menuAnchor = 'left',
  current,
  onChange,
  options,
  desiredItemWidth = null,
  onClickNew,
  newLabel = 'New',
  id,
}: SelectProps<Id>): React.ReactElement {
  const [opened, setOpened] = useState(false);

  const selectedOption = options.find((option) => option.id === current);
  const label = selectedOption ? selectedOption.label : '-';

  // Control inline editing state
  const [inputId, setInputId] = useState<Id | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [inputEditAction, setInputEditAction] = useState<EditAction<Id> | null>(
    null
  );

  // Try to commit the edit, sending the changes to the provided callback.
  // If the callback returns `true`, then the edit is ended.
  // If the callback returns `false`, then the edit is not committed
  //    and will remain active (for the user to fix the issue).
  // Does not close the selection box.
  // Returns whether the commit was successful.
  const tryCommit = (): boolean => {
    if (inputEditAction === null) return false;
    if (inputId === null) return false;
    const committedValue = inputValue.trim();

    if (inputEditAction.onCommit(committedValue, inputId)) {
      setInputId(null);
      setInputValue('');
      setInputEditAction(null);
      return true;
    }

    return false;
  };

  // Abandon the edit, discarding the changes.
  // Does not close the selection box.
  const abandonEdit = (): void => {
    setInputId(null);
    setInputValue('');
    setInputEditAction(null);
  };

  // Handle when the user presses 'Enter' or 'Escape'
  // to commit or abandon an in-progress edit, respectively.
  // If either key is pressed and the operation was successful,
  // then we also close the Select box.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (inputEditAction === null) return;
    if (inputId === null) return;

    if (e.key === 'Enter') {
      if (tryCommit()) {
        setOpened(false);
      }
    }
    if (e.key === 'Escape') {
      abandonEdit();
      setOpened(false);
    }
  };

  // Pass calls to `setOpened` through this,
  // to block closing the selection box when there is an active edit.
  const trySetOpened = (newOpened: boolean): void => {
    // If there is an active edit and the caller is trying
    // to close the Select box, prevent this
    if (inputId !== null && !newOpened) return;

    setOpened(newOpened);
  };

  return (
    <div
      className={classes('Button', 'Select', className, `anchor-${menuAnchor}`)}
      onClick={(): void => trySetOpened(!opened)}
      style={style}
      id={id}
    >
      <div className="text">{label}</div>
      <FontAwesomeIcon fixedWidth icon={faCaretDown} />
      {opened && (
        <div className="intercept" onClick={(): void => trySetOpened(false)} />
      )}
      {opened && (
        <div
          className="option-container"
          style={desiredItemWidth != null ? { width: desiredItemWidth } : {}}
        >
          {options.map(({ id: optionId, label: optionLabel, actions = [] }) => (
            <div
              key={String(optionId)}
              className={classes(
                'option',
                optionId === inputId && 'option--inputting'
              )}
            >
              {inputId === optionId ? (
                <AutoFocusInput
                  className="option__input"
                  value={inputValue}
                  onChange={(e): void => setInputValue(e.target.value)}
                  placeholder={optionLabel}
                  onKeyDown={handleKeyDown}
                />
              ) : (
                <Button
                  className="option__button"
                  key={optionId}
                  onClick={(): void => onChange(optionId)}
                >
                  {optionLabel}
                </Button>
              )}
              {actions.map((action, i) => (
                <React.Fragment key={i}>
                  {action.type === 'button' ? (
                    <>
                      <Button
                        className="option__action-button"
                        onClick={(e): void => {
                          e.stopPropagation();

                          // Abandon any in-progress edit
                          if (inputId !== null) abandonEdit();

                          action.onClick(optionId);
                        }}
                      >
                        <FontAwesomeIcon
                          fixedWidth
                          id={action.id}
                          icon={action.icon}
                        />
                      </Button>
                      {action.tooltip && (
                        <ReactTooltip
                          anchorId={action.id}
                          variant="dark"
                          place="left"
                        >
                          {action.tooltip}
                        </ReactTooltip>
                      )}
                    </>
                  ) : (
                    <>
                      {optionId === inputId ? (
                        <>
                          <Button
                            className="option__action-button"
                            onClick={(e): void => {
                              e.stopPropagation();
                              tryCommit();
                            }}
                          >
                            <FontAwesomeIcon fixedWidth icon={faCheck} />
                          </Button>
                          <Button
                            className="option__action-button"
                            onClick={(e): void => {
                              e.stopPropagation();
                              abandonEdit();
                            }}
                          >
                            <FontAwesomeIcon fixedWidth icon={faTimes} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            className="option__action-button"
                            onClick={(e): void => {
                              e.stopPropagation();
                              // Start a new edit (ignore any in-progress edits)
                              setInputId(optionId);
                              setInputValue(optionLabel);
                              setInputEditAction(action);
                            }}
                          >
                            <FontAwesomeIcon
                              fixedWidth
                              icon={action.icon}
                              id={action.id}
                            />
                          </Button>
                          {action.tooltip && (
                            <ReactTooltip
                              anchorId={action.id}
                              variant="dark"
                              place="left"
                            >
                              {action.tooltip}
                            </ReactTooltip>
                          )}
                        </>
                      )}
                    </>
                  )}
                </React.Fragment>
              ))}
            </div>
          ))}
          {onClickNew !== undefined && (
            <div className="option" id={id ? `${id}-new-button` : undefined}>
              <Button className="option__button" onClick={onClickNew}>
                <FontAwesomeIcon
                  fixedWidth
                  icon={faPlus}
                  style={{ marginRight: 8 }}
                />
                {newLabel}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type LoadingSelectProps = {
  className?: string;
  label?: string;
};

/**
 * Visually similar to a `<Select>` component,
 * except it cannot be interacted with and displays the given label text
 * (default: "Loading") next to a small spinner
 */
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

export type DropdownMenuProps = {
  className?: string;
  style?: React.CSSProperties;
  menuAnchor?: 'left' | 'right';
  children: React.ReactNode;
  items: DropdownMenuAction[];
  disabled?: boolean;
};

export interface DropdownMenuAction {
  label: React.ReactNode;
  icon?: IconDefinition;
  id?: string;
  onClick?: () => void;
}

/**
 * A `<DropdownMenu>` is similar to a `<Select>` except
 * it can be used in scenarios where there is no item to select,
 * but you still want to display a dropdown with buttons.
 */
export function DropdownMenu({
  className,
  style,
  menuAnchor = 'left',
  children,
  items,
  disabled = false,
}: DropdownMenuProps): React.ReactElement {
  const [opened, setOpened] = useState(false);
  return (
    <div
      className={classes(
        'Button',
        'Select',
        disabled && 'disabled',
        className,
        `anchor-${menuAnchor}`
      )}
      onClick={(): void => {
        if (!disabled) setOpened(!opened);
      }}
      style={style}
      id="export-button"
    >
      {children}
      {opened && (
        <div className="intercept" onClick={(): void => setOpened(false)} />
      )}
      {opened && (
        <div className="option-container">
          {items.map(({ label, icon, onClick, id }, i) => (
            <div
              className={classes('option', onClick == null && 'option--text')}
              key={i}
              id={id}
            >
              {onClick != null ? (
                <Button className="option__button" onClick={onClick}>
                  {icon != null && (
                    <FontAwesomeIcon
                      fixedWidth
                      icon={icon}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  {label}
                </Button>
              ) : (
                <div
                  className="option__text"
                  // Prevent clicking on the text from closing the dropdown
                  onClick={(e): void => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {icon != null && (
                    <FontAwesomeIcon
                      fixedWidth
                      icon={icon}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  {label}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Private sub-components

type AutoFocusInputProps = {
  className?: string;
  style?: React.CSSProperties;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

/**
 * Simple wrapper around `<input>`
 * that automatically focuses its contents when it is first mounted
 */
export function AutoFocusInput({
  className,
  style,
  value,
  onChange,
  placeholder,
  onKeyDown,
  onBlur,
}: AutoFocusInputProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (inputRef.current === null) return;
    inputRef.current.focus();
    inputRef.current.select();
  }, []);

  return (
    <input
      className={className}
      style={style}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      ref={inputRef}
      type="text"
      onBlur={onBlur}
    />
  );
}
