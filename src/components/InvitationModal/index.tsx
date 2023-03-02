import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useMemo,
  useContext,
  useState,
} from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { faCircle, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { castDraft } from 'immer';
import axios, { AxiosError } from 'axios';

import { ScheduleContext } from '../../contexts';
import { classes } from '../../utils/misc';
import Modal from '../Modal';
import Button from '../Button';
import { AccountContext, SignedIn } from '../../contexts/account';

import './stylesheet.scss';

/**
 * Inner content of the invitation modal.
 */
export function InvitationModalContent(): React.ReactElement {
  const [{ currentFriends, currentVersion, term }, { updateFriends }] =
    useContext(ScheduleContext);
  const accountContext = useContext(AccountContext);

  const emails = Object.keys(currentFriends ?? {}).map((friend: string) => {
    return [
      currentFriends[friend]!.email,
      currentFriends[friend]!.status,
      friend,
    ];
  });

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

  const sendInvitation = async (): Promise<void> => {
    const IdToken = await (accountContext as SignedIn).getToken();
    axios
      .post(
        'http://127.0.0.1:5001/gt-scheduler-web-dev/us-central1/createFriendInvitation',
        {
          term,
          friendEmail: input,
          IDToken: IdToken,
          version: currentVersion,
        }
      )
      .then((res) => {
        setValidMessage('Successfully sent!');
        setValidClassName('valid-email');
      })
      .catch((err: AxiosError) => {
        setValidClassName('invalid-email');
        // if (err.response && err.response.data.message) {
        //   setValidMessage(err.response.data.message);
        //   return;
        // }

        setValidMessage('Error sending invitation. Please try again later.');
      });
  };

  // verify email with a regex and send invitation if valid
  const verifyEmail = (): void => {
    if (
      // eslint-disable-next-line
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        input
      )
    ) {
      sendInvitation()
        .then(() => {
          setInput('');
        })
        .catch((err) => {
          setValidMessage('Error sending invitation. Please try again later.');
          setValidClassName('invalid-email');
        });
    } else {
      setValidMessage('Invalid Email');
      setValidClassName('invalid-email');
    }
  };

  // delete friend from record of friends
  const handleDelete = (friendId: string): void => {
    const newFriends = castDraft(currentFriends);
    delete newFriends[friendId];
    updateFriends(currentVersion, newFriends);
  };

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
          <button type="button" className="send-button" onClick={verifyEmail}>
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
                <Button
                  className="button-remove"
                  onClick={(): void => {
                    handleDelete(element[2]!);
                  }}
                >
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
