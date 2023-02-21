import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { faCircle, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { classes } from '../../utils/misc';
import Modal from '../Modal';
import Button from '../Button';

import './stylesheet.scss';

/**
 * Inner content of the invitation modal.
 */
export function InvitationModalContent(): React.ReactElement {
  // Array for testing style of shared emails
  // eslint-disable-next-line
  const [emails, setEmails] = useState([
    ['user1@example.com', 'Pending'],
    ['user2@example.com', 'Accepted'],
    ['ReallyLongNameThatWillNotFitInRowAbove@example.com', 'Accepted'],
    ['goodEmail@gmail.com', 'Accepted'],
    ['user12@example.com', 'Pending'],
    ['user22@example.com', 'Accepted'],
    ['2ReallyLongNameThatWillNotFitInRowAbove@example.com', 'Accepted'],
    ['2goodEmail@gmail.com', 'Accepted'],
  ]);

  // Array to test invalid email
  const validUsers = [
    'user1@example.com',
    'user2@example.com',
    'ReallyLongNameThatWillNotFitInRowAbove@example.com',
    'goodEmail@gmail.com',
  ];
  const [input, setInput] = useState('');
  const [validMessage, setValidMessage] = useState('');
  const [validClassName, setValidClassName] = useState('');

  // Boolean to hide and open search dropdown
  const [hidden, setHidden] = useState(true);

  // Array for testing dropdown of recent invites
  // eslint-disable-next-line
  const [recentInvites, setRecentInvites] = useState<string[]>([
    'user1@example.com',
    'user2@example.com',
  ]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleChangeSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    let search = e.target.value.trim();
    const results = /^([A-Z]+)(\d.*)$/i.exec(search);
    if (results != null) {
      const [, email, number] = results as unknown as [string, string, string];
      search = `${email}${number}`;
    }
    setHidden(false);
    setInput(search);
    setValidMessage('');
    setActiveIndex(-1);
  }, []);

  const searchResults = useMemo(() => {
    if (!input) return recentInvites;
    const results = /^([A-Z]+) ?((\d.*)?)$/i.exec(input?.toUpperCase());
    if (!results) {
      return [];
    }

    return recentInvites.filter((invite) => {
      const searchMatch = recentInvites.includes(invite);
      return searchMatch;
    });
  }, [input, recentInvites]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          setHidden(false);
          setInput(
            searchResults[
              Math.min(activeIndex + 1, searchResults.length - 1)
            ] as string
          );
          setActiveIndex(Math.min(activeIndex + 1, searchResults.length - 1));
          break;
        case 'ArrowUp':
          setHidden(false);
          setInput(searchResults[Math.max(activeIndex - 1, 0)] as string);
          setActiveIndex(Math.max(activeIndex - 1, 0));
          break;
        case 'Escape':
          setHidden(true);
          break;
        case 'Enter':
          setHidden(true);
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [searchResults, activeIndex]
  );

  const handleCloseDropdown = useCallback(
    (index?: number) => {
      if (index !== undefined) {
        setInput(searchResults[index] as string);
        setActiveIndex(index);
      }
      setHidden(true);
    },
    [searchResults]
  );

  function verifyUser(): void {
    if (validUsers.includes(input)) {
      setValidMessage('Successfully sent!');
      setValidClassName('valid-email');
      setInput('');
    } else {
      setValidMessage('Invalid Email');
      setValidClassName('invalid-email');
    }
  }

  return (
    <div className="invitation-modal-content">
      <div className="top-block">
        <h2>Share Schedule</h2>
        <p>
          Enter an email associated with another user&apos;s GT-Scheduler
          account & we&apos;ll send them an invite via email to import this
          schedule into their view
        </p>
        <div className="email-input-block">
          <div className="email-input">
            <input
              type="email"
              id="email"
              key="email"
              value={input}
              className="email"
              placeholder="recipient@example.com"
              list="recent-invites"
              onChange={handleChangeSearch}
              onFocus={handleChangeSearch}
              onKeyDown={handleKeyDown}
              onBlur={(): void => handleCloseDropdown()}
            />
            {!hidden && (
              <div id="recent-invites">
                {searchResults.map((element, index) => (
                  <div
                    className={classes(
                      'search-option',
                      index === activeIndex && 'active'
                    )}
                    onMouseDown={(): void => handleCloseDropdown(index)}
                  >
                    {element}
                  </div>
                ))}
              </div>
            )}
            <text className={validClassName}>{validMessage}</text>
          </div>
          <button type="button" className="send-button" onClick={verifyUser}>
            Send Invite
          </button>
        </div>
      </div>
      <hr className="divider" />
      <div className="invited-users">
        <p>
          Users Invited to View <strong>Primary</strong>
        </p>
        <div className="shared-emails" key="email">
          {emails.map((element) => (
            <div className="email-and-status" id={element[0]}>
              <div className="individual-shared-email" id={element[1]}>
                {element[0]}
                <Button className="button-remove">
                  <FontAwesomeIcon className="circle" icon={faCircle} />
                  <FontAwesomeIcon className="remove" icon={faClose} />
                </Button>
                <ReactTooltip
                  anchorId={element[0]}
                  className="status-tooltip"
                  variant="dark"
                  place="top"
                  offset={2}
                >
                  Status: {element[1]}
                </ReactTooltip>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type InvitationModalProps = {
  show: boolean;
  onHide: () => void;
};

/**
 * Component that can be used to show the invitaion modal.
 */
export default function InvitationModal({
  show,
  onHide,
}: InvitationModalProps): React.ReactElement {
  return (
    <Modal
      show={show}
      className="invatation-modal"
      onHide={onHide}
      buttons={[
        { label: 'Cancel', onClick: (): void => onHide(), cancel: true },
      ]}
      width={550}
    >
      <InvitationModalContent />
    </Modal>
  );
}
