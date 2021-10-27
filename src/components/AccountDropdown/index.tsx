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
import { DropdownMenu } from '../Select';
import Spinner from '../Spinner';

export type AccountDropdownProps = {
  state: AccountContextValue | { type: 'loading' };
};

export default function AccountDropdown({
  state,
}: AccountDropdownProps): React.ReactElement {
  const [loginOpen, setLoginOpen] = useState(false);
  const hideLogin = useCallback(() => setLoginOpen(false), []);

  let content;
  if (state.type === 'loading') {
    content = (
      <DropdownMenu disabled menuAnchor="right" items={[]}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              height: 40,
              width: 40,
              borderRadius: '10000px',
              backgroundColor: '#0C797D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 4,
            }}
          >
            <Spinner size={24} />
          </div>
          <FontAwesomeIcon fixedWidth icon={faCaretDown} />
        </div>
      </DropdownMenu>
    );
  } else {
    // TODO clean up code
    const initials =
      state.type === 'signedIn'
        ? getInitials(state.name ?? state.email ?? state.id)
        : '';
    content = (
      <DropdownMenu
        menuAnchor="right"
        items={
          state.type === 'signedIn'
            ? [
                {
                  label: <SignedInLabel state={state} />,
                },
                {
                  label: 'Sign out',
                  icon: faSignOutAlt,
                  onClick: (): void => state.signOut(),
                },
              ]
            : [
                {
                  label: 'Sign in',
                  icon: faSignInAlt,
                  onClick: (): void => {
                    setLoginOpen(true);
                  },
                },
              ]
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              height: 40,
              width: 40,
              borderRadius: '10000px',
              backgroundColor: '#0C797D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 4,
            }}
          >
            {state.type === 'signedIn' ? (
              <span
                style={{
                  fontSize:
                    initials.length <= 1 ? 22 : initials.length === 2 ? 19 : 17,
                  fontWeight: 400,
                  textShadow: '0 0 6px rgba(0,0,0,0.5)',
                  color: 'white',
                }}
              >
                {initials.slice(0, 3)}
              </span>
            ) : (
              <FontAwesomeIcon
                fixedWidth
                icon={faUserCircle}
                style={{
                  fontSize: '1.5rem',
                  filter: 'drop-shadow(0 0 6px rgb(0,0,0,0.5))',
                  color: 'white',
                }}
              />
            )}
          </div>
          <FontAwesomeIcon fixedWidth icon={faCaretDown} />
        </div>
      </DropdownMenu>
    );
  }

  return (
    <>
      {content} <LoginModal show={loginOpen} onHide={hideLogin} />
    </>
  );
}

// Private sub-components

type SignedInLabelProps = {
  state: SignedIn;
};

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
    <div style={{ lineHeight: 1.25 }}>
      <span style={{ opacity: 0.6 }}>Signed in as:</span>
      <br />
      {signedInAs}
      <br />
      <span style={{ opacity: 0.6 }}>{providerText}</span>
    </div>
  );
}

function getInitials(displayName: string): string {
  const regex = /\b\w/g;
  const matches = displayName.match(regex);
  if (matches === null) return '';
  return matches.join('');
}
