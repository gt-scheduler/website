import React from 'react';
import { Modal as ReactOverlaysModal } from 'react-overlays';
import { CSSTransition } from 'react-transition-group';

import { classes } from '../../utils/misc';
import { DESKTOP_BREAKPOINT } from '../../constants';
import usePrevious from '../../hooks/usePrevious';
import useScreenWidth from '../../hooks/useScreenWidth';

import './stylesheet.scss';

const transitionSpeed = 200; // ms

export interface ModalButtonProps {
  label: React.ReactNode;
  onClick?: () => void;
  cancel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type ModalProps = {
  children?: React.ReactNode;
  buttonPrompt?: string;
  buttons?: ModalButtonProps[];
  show: boolean;
  onHide: () => void;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Whether the modal should use the previous value of children
   * while animating the hide.
   * Useful if the content is dependent on state that changes
   * at the same time as the show prop;
   * without this, the other content would flash as the modal disappears.
   * Default: `true`
   */
  preserveChildrenWhileHiding?: boolean;
  checkbox?: boolean;
  setCheckbox?: (checkbox: boolean) => void;
  checkboxContent?: string;
};

type TransitionProps = {
  in: boolean;
  appear?: boolean | undefined;
  unmountOnExit?: boolean | undefined;
  children?: React.ReactNode;
};

/**
 * Displays a modal popup
 * that can be used to display information to the user
 * or ask them to confirm an action.
 *
 * Uses https://react-bootstrap.github.io/react-overlays/api/Modal/
 * to implement the interaction & accessibility.
 */
export default function Modal({
  children,
  buttonPrompt,
  buttons = [],
  show,
  onHide,
  width = 480,
  className,
  style,
  preserveChildrenWhileHiding = true,
  checkbox,
  setCheckbox,
  checkboxContent,
}: ModalProps): React.ReactElement {
  // Empty fragment is used to provide a non-nil default value.
  // This lets an undefined children prop represent a different state
  // (`previousChildren` is an empty fragment) than the initial render
  // (`previousChildren` is null).
  // eslint-disable-next-line react/jsx-no-useless-fragment
  const previousChildren = usePrevious(children ?? <></>);
  const previousShow = usePrevious(show);
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);
  let derivedChildren = children;
  if (!show && previousShow === true) {
    // We are transitioning out,
    // check to see if we should use the previous children
    if (preserveChildrenWhileHiding && previousChildren != null) {
      derivedChildren = previousChildren;
    }
  }

  return (
    <ReactOverlaysModal
      show={show}
      onHide={onHide}
      onBackdropClick={onHide}
      className="modal-positioner"
      renderBackdrop={(props): React.ReactElement => (
        <div {...props} className="modal-backdrop" />
      )}
      transition={FadeZoom}
      backdropTransition={Fade}
    >
      <div
        className={classes('modal', className, mobile && 'mobile')}
        style={{ width, ...style }}
      >
        <div className="modal__content">{derivedChildren}</div>
        {buttons.length > 0 && (
          <div
            className={classes(
              'modal__footer',
              checkboxContent && 'has-checkbox'
            )}
          >
            {buttonPrompt && <div>{buttonPrompt}</div>}
            {checkboxContent && (
              <div className="checkbox">
                <div
                  onClick={(): void => {
                    if (setCheckbox !== undefined) {
                      setCheckbox(!checkbox);
                    }
                  }}
                  style={checkbox ? { backgroundColor: '#FFFFFF' } : {}}
                />
                <p>{checkboxContent}</p>
              </div>
            )}
            <div className="button_container">
              {buttons.map((props, i) => (
                <ModalButton {...props} key={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ReactOverlaysModal>
  );
}

// Private sub-components

function ModalButton({
  label,
  onClick,
  cancel,
  className,
  style,
}: ModalButtonProps): React.ReactElement {
  return (
    <button
      className={classes(
        'modal__button',
        cancel && 'modal__button--cancel',
        !cancel && 'modal__button--normal',
        className
      )}
      type="button"
      onClick={onClick}
      style={style}
    >
      {label}
    </button>
  );
}

function Fade({ children, ...rest }: TransitionProps): React.ReactElement {
  return (
    <CSSTransition
      {...rest}
      timeout={transitionSpeed}
      classNames="modal-transition--fade"
    >
      {children}
    </CSSTransition>
  );
}

function FadeZoom({ children, ...rest }: TransitionProps): React.ReactElement {
  return (
    <CSSTransition
      {...rest}
      timeout={transitionSpeed}
      classNames="modal-transition--fade-zoom"
    >
      {children}
    </CSSTransition>
  );
}
