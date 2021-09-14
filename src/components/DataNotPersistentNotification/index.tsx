import React from 'react';

import WarningHeader from '../WarningHeader';

import './stylesheet.scss';

/**
 * Renders a notification that schedule data is not persistent
 * and that the user can't use the application.
 */
export function renderDataNotPersistentNotification(
  props: DataNotPersistentNotificationProps
): React.ReactElement {
  return <DataNotPersistentNotification {...props} />;
}

export type DataNotPersistentNotificationProps = {
  onAccept: () => void;
};

/**
 * Content that is shown in the modal when `showDataNotPersistentNotification`
 * is called
 */
export function DataNotPersistentNotification({
  onAccept,
}: DataNotPersistentNotificationProps): React.ReactElement {
  return (
    <div className="data-not-persistent-notification">
      <WarningHeader />
      <p>
        Your browser doesn&apos;t support storing data using local storage,
        which gt-scheduler relies on to persist schedule data between sessions.
      </p>
      <p>Reasons this might be the case:</p>
      <ul>
        <li>
          You&apos;re using an outdated browser that doesn&apos;t support local
          storage
        </li>
        <li>You&apos;re using Mobile Safari with private mode enabled</li>
        <li>You&apos;re using Safari with cookies disabled</li>
      </ul>
      <p>
        <strong>
          Would you like to continue using gt-scheduler? Your schedules will not
          be saved once you close this tab.
        </strong>
      </p>
      <button
        className="data-not-persistent-notification--button"
        onClick={onAccept}
        type="button"
      >
        Accept
      </button>
    </div>
  );
}
