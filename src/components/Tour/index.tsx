import {
  StepType,
  ProviderProps,
  PopoverContentProps,
  useTour,
} from '@reactour/tour';
import React from 'react';

import './stylesheet.scss';
import '@reactour/popover/dist/index.css';

export const steps: StepType[] = [
  {
    selector: '#Recurring\\ Events',
    content: () => (
      <div>
        <h3 className="tour-header">Add recurring events</h3>
        <p className="tour-content">
          Use{' '}
          <b>
            <i>Recurring Events</i>
          </b>{' '}
          to block out meetings, work shifts, and any other weekly events you
          may need to schedule your classes around.
          <br />
          <br />
          Drag and drop events on the schedule view to adjust times.
        </p>
      </div>
    ),
  },
  {
    selector: '#Finals',
    content: () => (
      <div>
        <h3 className="tour-header">View Finals Matrix</h3>
        <p className="tour-content">
          Use the{' '}
          <b>
            <i>Finals Tab</i>
          </b>{' '}
          to view the final exam matrix.
          <br />
          <br />
          The final exam matrix for Fall 2023{' '}
          <b>
            <u>may not be fully finalized yet.</u>
          </b>
        </p>
      </div>
    ),
  },
  {
    selector: '.invite-button',
    highlightedSelectors: ['.invite-button', '.comparison-header'],
    content: () => (
      <div>
        <h3 className="tour-header">Share + Compare Schedule</h3>
        <p className="tour-content">
          Use{' '}
          <b>
            <i>Share Schedule</i>
          </b>{' '}
          to share your schedule with other students and they can share theirs
          back. <br />
          <br />
          Then, toggle{' '}
          <b>
            <i>Compare Schedule</i>
          </b>{' '}
          and click on the other students`&apos;` schedules to compare.
        </p>
      </div>
    ),
  },
  {
    selector: '.tour-button',
    content: () => (
      <div>
        <h3 className="tour-header">User Guide</h3>
        <p className="tour-content">
          Use the{' '}
          <b>
            <i>User Guide</i>
          </b>{' '}
          at any time to review the different features of GT Scheduler.
        </p>
      </div>
    ),
  },
];

type CloseProps = { onClick?: (() => void) | undefined };

export function Close({ onClick }: CloseProps): React.ReactElement {
  return (
    <button
      type="button"
      className="skip-tour-button"
      onClick={onClick}
      style={{
        position: 'absolute',
        bottom: '30px',
        left: '25px',
      }}
    >
      Skip Tutorial
    </button>
  );
}

export function nextButton(props: {
  setCurrentStep: ProviderProps['setCurrentStep'];
  currentStep: ProviderProps['currentStep'];
  steps?: ProviderProps['steps'];
  setIsOpen: PopoverContentProps['setIsOpen'];
}): React.ReactElement {
  return (
    <button
      type="button"
      className="tour-next-button"
      onClick={(): void => {
        if (props.currentStep === (props.steps?.length ?? 0) - 1) {
          props.setIsOpen(false);
          props.setCurrentStep?.(0);
        } else {
          props.setCurrentStep?.((props.currentStep ?? 0) + 1);
        }
      }}
      style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
      }}
    >
      {props.currentStep === (props.steps?.length ?? 0) - 1 ? 'Done' : 'Next'}
    </button>
  );
}

export default function Tour(): React.ReactElement {
  const { setIsOpen, setCurrentStep } = useTour();
  return (
    <div className="tour-button-wrapper">
      <button
        type="submit"
        className="tour-button"
        onClick={(): void => {
          setCurrentStep(0);
          setIsOpen(true);
        }}
      >
        ?
      </button>
    </div>
  );
}
