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
  let valid = false;

  // Boolean to hide and open search dropdown
  const [hidden, setHidden] = useState(true);

  // Array for testing dropdown of recent invites
  const [recentInvites, setRecentInvites] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleChangeSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    let search = e.target.value.trim();
    const results = /^([A-Z]+)(\d.*)$/i.exec(search);
    if (results != null) {
      const [, email, number] = results as unknown as [string, string, string];
      search = `${email} ${number}`;
    }
    setHidden(false);
    setInput(search);
    setValidMessage('');
  }, []);

  const searchResults = useMemo(() => {
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
          if (searchResults.length === 1) {
            setInput(searchResults[activeIndex] as string);
          } else {
            setInput(searchResults[activeIndex + 1] as string);
            setActiveIndex(Math.min(activeIndex + 1, searchResults.length - 1));
          }
          break;
        case 'ArrowUp':
          setInput(searchResults[activeIndex - 1] as string);
          setActiveIndex(Math.max(activeIndex - 1, 0));
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [searchResults, activeIndex]
  );

  function verifyUser(): void {
    validUsers.forEach((element) => {
      if (element === input) {
        valid = true;
        setValidMessage('Successfully sent!');
        setValidClassName('valid-email');
        if (!recentInvites.includes(input)) {
          setRecentInvites([...recentInvites, input]);
        }
        setInput('');
      }
      if (!valid) {
        valid = false;
        setValidMessage('Invalid Email');
        setValidClassName('invalid-email');
      }
    });
    setHidden(true);
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
              onChange={(e): void => setInput(e.target.value)}
              onInput={handleChangeSearch}
              onKeyDown={handleKeyDown}
            />
            {searchResults.length > 0 && hidden === false ? (
              <div id="recent-invites">
                {searchResults.map((element) => (
                  <div
                    className={classes(
                      'search-option',
                      element === searchResults[activeIndex] && 'active'
                    )}
                  >
                    {element}
                  </div>
                ))}
              </div>
            ) : (
              <div />
            )}
            <text className={validClassName}>{validMessage}</text>
          </div>
          <button
            type="button"
            className="send-button"
            onClick={(e): void => {
              verifyUser();
            }}
          >
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

export type LoginModalProps = {
  show: boolean;
  onHide: () => void;
};

/**
 * Component that can be used to show the invitaion modal.
 */
export default function InvitationModal({
  show,
  onHide,
}: LoginModalProps): React.ReactElement {
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
