import React, { useState, useCallback } from 'react';
import {
  faCaretDown,
  faSignOutAlt,
  faSignInAlt,
  faUserCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { AccountContextValue, SignedIn } from '../../contexts/account';
import LoginModal from '../LoginModal';
import { DropdownMenu, DropdownMenuAction } from '../Select';
import Spinner from '../Spinner';
import { classes } from '../../utils/misc';
import useFeatureFlag from '../../hooks/useFeatureFlag';

import './stylesheet.scss';

export type AccountDropdownProps = {
  state: AccountContextValue | { type: 'loading' };
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Renders the dropdown menu in the app header
 * that lets the user either:
 * - sign in if they aren't logged in,
 *   by displaying the login modal, or
 * - view who they are logged in as, and sign out if desired.
 * Additionally, it shows the initials of the user
 * in a circle when they are logged in
 * (similar to Google account "icons").
 * Note that this functionality is currently hidden behind a feature flag
 * (pending a future feature release closer to schedules releasing):
 * Run the following command in the browser console and then refresh:
 *
 * ```
 * window.localStorage.setItem('ff-2021-10-26-account-sync', 'true')
 * ```
 */
export default function AccountDropdown({
  state,
  className,
  style,
}: AccountDropdownProps): React.ReactElement | null {
  const [loginOpen, setLoginOpen] = useState(false);
  const hideLogin = useCallback(() => setLoginOpen(false), []);

  const isEnabled = useFeatureFlag('2021-10-26', 'account-sync');
  if (!isEnabled) return null;

  let items: DropdownMenuAction[];
  let circleContent: React.ReactNode;
  let disabled: boolean;
  switch (state.type) {
    case 'loading':
      items = [];
      circleContent = <Spinner size={24} />;
      disabled = true;
      break;
    case 'signedIn':
      items = [
        {
          label: <SignedInLabel state={state} />,
        },
        {
          label: 'Sign out',
          icon: faSignOutAlt,
          onClick: (): void => state.signOut(),
        },
      ];
      circleContent = <UserInitials state={state} />;
      disabled = false;
      break;
    case 'signedOut':
      items = [
        {
          label: 'Sign in',
          icon: faSignInAlt,
          onClick: (): void => {
            setLoginOpen(true);
          },
        },
      ];
      circleContent = (
        <FontAwesomeIcon
          fixedWidth
          icon={faUserCircle}
          className="account-dropdown__signed-out-icon"
        />
      );
      disabled = false;
      break;
    default:
      // unreachable
      return null;
  }

  return (
    <>
      <DropdownMenu
        disabled={disabled}
        menuAnchor="right"
        items={items}
        className={classes('account-dropdown', className)}
        style={style}
      >
        <div className="account-dropdown__content">
          <div className="account-dropdown__circle">{circleContent}</div>
          <FontAwesomeIcon fixedWidth icon={faCaretDown} />
        </div>
      </DropdownMenu>
      <LoginModal show={loginOpen} onHide={hideLogin} />
    </>
  );
}

// Private sub-components

type UserInitialsProps = {
  state: SignedIn;
};

/**
 * Shows the initials of the user's name, email, or id where available,
 * changing the size of each letter depending on the number of initials.
 * Supports up to 4 initials.
 */
function UserInitials({ state }: UserInitialsProps): React.ReactElement {
  const initials = getInitials(state.name ?? state.email ?? state.id);
  return (
    <span
      className="account-dropdown__user-initials"
      style={{
        fontSize: initials.length <= 1 ? 22 : initials.length === 2 ? 19 : 17,
      }}
    >
      {initials.slice(0, 3)}
    </span>
  );
}

/**
 * Extracts the initials from the given name
 */
function getInitials(displayName: string): string {
  const regex = /\b\w/g;
  const matches = displayName.match(regex);
  if (matches === null) return '';
  return matches.join('');
}

type SignedInLabelProps = {
  state: SignedIn;
};

/**
 * Formats the text shown in the account dropdown when the user is signed in,
 * telling them their name, email, and provider when available.
 */
function SignedInLabel({ state }: SignedInLabelProps): React.ReactElement {
  let signedInAs: React.ReactNode;
  if (state.name !== null && state.email !== null) {
    signedInAs = (
      <>
        <strong>{state.name}</strong> ({state.email})
      </>
    );
  } else if (state.name !== null || state.email !== null) {
    signedInAs = `${state.name ?? state.email ?? ''}`;
  } else {
    signedInAs = state.id;
  }
  let providerText = '';
  if (state.provider !== null) {
    providerText = ` via ${state.provider}`;
  }
  return (
    <div>
      <span className="account-dropdown__signed-in-label-faded">
        Signed in as:
      </span>
      <br />
      {signedInAs}
      <br />
      <span className="account-dropdown__signed-in-label-faded">
        {providerText}
      </span>
    </div>
  );
}
