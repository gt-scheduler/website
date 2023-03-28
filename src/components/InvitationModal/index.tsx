import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useContext,
  useState,
  useRef,
} from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { faCircle, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { castDraft } from 'immer';
import axios, { AxiosError } from 'axios';

import { ApiErrorResponse } from '../../data/types';
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
  const [{ currentFriends, currentVersion, term }, { deleteFriendRecord }] =
    useContext(ScheduleContext);
  const accountContext = useContext(AccountContext);

  const input = useRef<HTMLInputElement>(null);
  const [validMessage, setValidMessage] = useState('');
  const [validClassName, setValidClassName] = useState('');

  const handleChangeSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValidMessage('');
    setValidClassName('');
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        verifyEmail();
        break;
      default:
        return;
    }
    e.preventDefault();
  }, []);

  const sendInvitation = async (): Promise<void> => {
    const IdToken = await (accountContext as SignedIn).getToken();
    return axios.post(
      'http://127.0.0.1:5001/gt-scheduler-web-dev/us-central1/createFriendInvitation',
      {
        term,
        friendEmail: input.current?.value,
        IDToken: IdToken,
        version: currentVersion,
      }
    );
  };

  // verify email with a regex and send invitation if valid
  const verifyEmail = (): void => {
    console.log(input.current?.value);
    if (
      // eslint-disable-next-line
      input.current &&
      /^\S+@\S+\.\S+$/.test(input.current.value)
    ) {
      sendInvitation()
        .then(() => {
          setValidMessage('Successfully sent!');
          setValidClassName('valid-email');
          if (input.current) {
            input.current.value = '';
          }
        })
        .catch((err) => {
          console.log(err);
          setValidClassName('invalid-email');
          const error = err as AxiosError;
          if (error.response) {
            const apiError = error.response.data as ApiErrorResponse;
            setValidMessage(apiError.message);
            return;
          }
          setValidMessage('Error sending invitation. Please try again later.');
        });
    } else {
      setValidMessage('Invalid Email');
      setValidClassName('invalid-email');
    }
  };

  // delete friend from record of friends
  const handleDelete = (friendId: string): void => {
    deleteFriendRecord(currentVersion, friendId);
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
              ref={input}
              className="email"
              placeholder="recipient@example.com"
              list="recent-invites"
              onFocus={handleChangeSearch}
              onKeyDown={handleKeyDown}
              onChange={handleChangeSearch}
            />
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
          {Object.keys(currentFriends ?? {}).map((friend) => (
            <div
              className="email-and-status"
              id={currentFriends[friend]?.email}
            >
              <div
                className={classes(
                  'individual-shared-email',
                  currentFriends[friend]?.status
                )}
              >
                {currentFriends[friend]?.email}
                <Button
                  className="button-remove"
                  onClick={(): void => {
                    handleDelete(friend);
                  }}
                >
                  <FontAwesomeIcon className="circle" icon={faCircle} />
                  <FontAwesomeIcon className="remove" icon={faClose} />
                </Button>
                <ReactTooltip
                  anchorId={currentFriends[friend]?.email}
                  className="status-tooltip"
                  variant="dark"
                  place="top"
                  offset={2}
                >
                  Status: {currentFriends[friend]?.status}
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
