import React, {
  KeyboardEvent,
  useCallback,
  useContext,
  useState,
  useRef,
  useMemo,
} from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { faCircle, faClose, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios, { AxiosError } from 'axios';

import { ApiErrorResponse } from '../../data/types';
import { ScheduleContext } from '../../contexts';
import { DESKTOP_BREAKPOINT, CLOUD_FUNCTION_BASE_URL } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';
import { classes } from '../../utils/misc';
import Modal from '../Modal';
import Button from '../Button';
import { AccountContext, SignedIn } from '../../contexts/account';
import { ErrorWithFields, softError } from '../../log';

import './stylesheet.scss';

/**
 * Inner content of the invitation modal.
 */
export function InvitationModalContent(): React.ReactElement {
  const [removeInvitationOpen, setRemoveInvitationOpen] = useState(false);
  const [currentFriendId, setCurrentFriendId] = useState('');

  const [{ currentFriends, currentVersion, term }, { deleteFriendRecord }] =
    useContext(ScheduleContext);
  const accountContext = useContext(AccountContext);
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  const input = useRef<HTMLInputElement>(null);
  const [validMessage, setValidMessage] = useState('');
  const [validClassName, setValidClassName] = useState('');

  const redirectURL = useMemo(
    () => window.location.href.split('/#')[0] ?? '/',
    []
  );

  const handleChangeSearch = useCallback(() => {
    setValidMessage('');
    setValidClassName('');
  }, []);

  const sendInvitation = useCallback(async (): Promise<void> => {
    const IdToken = await (accountContext as SignedIn).getToken();
    const data = JSON.stringify({
      term,
      friendEmail: input.current?.value,
      IDToken: IdToken,
      version: currentVersion,
      redirectURL,
    });
    return axios.post(
      `${CLOUD_FUNCTION_BASE_URL}/createFriendInvitation`,
      `data=${data}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  }, [accountContext, currentVersion, term, redirectURL]);

  // verify email with a regex and send invitation if valid
  const verifyEmail = useCallback((): void => {
    if (!input.current || !/^\S+@\S+\.\S+$/.test(input.current.value)) {
      setValidMessage('Invalid Email');
      return setValidClassName('invalid-email');
    }

    if (
      Object.values(currentFriends).findIndex(
        (friend) =>
          friend.email === input.current?.value && friend.status === 'Accepted'
      ) !== -1
    ) {
      setValidMessage('Email has already accepted an invite');
      return setValidClassName('invalid-email');
    }

    sendInvitation()
      .then(() => {
        if (input.current) {
          input.current.value = '';
        }
        setValidMessage('Successfully sent!');
        setValidClassName('valid-email');
      })
      .catch((err) => {
        setValidClassName('invalid-email');
        const error = err as AxiosError;
        if (error.response) {
          const apiError = error.response.data as ApiErrorResponse;
          setValidMessage(apiError.message);
          return;
        }
        setValidMessage('Error sending invitation. Please try again later.');
      });
  }, [sendInvitation, currentFriends]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter':
          verifyEmail();
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [verifyEmail]
  );

  // delete friend from record of friends
  const handleDelete = useCallback(
    async (friendId: string): Promise<void> => {
      deleteFriendRecord(currentVersion, friendId);
      const data = JSON.stringify({
        IDToken: await (accountContext as SignedIn).getToken(),
        friendId,
        term,
        version: currentVersion,
      });
      axios
        .post(
          `${CLOUD_FUNCTION_BASE_URL}/deleteInvitationFromSender`,
          `data=${data}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
        .catch((err) => {
          softError(
            new ErrorWithFields({
              message: 'delete friend record failed',
              source: err,
              fields: {
                user: (accountContext as SignedIn).id,
                friend: friendId,
                term,
                version: currentVersion,
              },
            })
          );
        });
    },
    [accountContext, currentVersion, deleteFriendRecord, term]
  );

  function showRemoveInvitation(friendId: string): void {
    setRemoveInvitationOpen(true);
    setCurrentFriendId(friendId);
  }

  // delete friend from record of friends and close modal
  const hideRemoveInvitation = useCallback(
    (confirm: boolean) => {
      setRemoveInvitationOpen(false);
      if (confirm) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        handleDelete(currentFriendId);
      }
    },
    [currentFriendId, handleDelete]
  );

  return (
    <div className={classes('invitation-modal-content', mobile && 'mobile')}>
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
        {Object.keys(currentFriends).length !== 0 ? (
          <div className="shared-emails" key="email">
            {Object.entries(currentFriends).map(([friendId, friend]) => (
              <div className="email-and-status" id={friend.email}>
                <div
                  className={classes('individual-shared-email', friend.status)}
                >
                  <p className="email-text">{friend.email}</p>
                  <Button
                    className="button-remove"
                    onClick={(): void => {
                      showRemoveInvitation(friendId);
                    }}
                  >
                    <FontAwesomeIcon className="circle" icon={faCircle} />
                    <FontAwesomeIcon className="remove" icon={faClose} />
                  </Button>
                  <ReactTooltip
                    anchorId={friend.email}
                    className="status-tooltip"
                    variant="dark"
                    place="top"
                    offset={2}
                  >
                    Status: {friend.status}
                  </ReactTooltip>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-invited-users">No friends have been invited</div>
        )}{' '}
      </div>
      <RemoveInvitationModal
        showRemove={removeInvitationOpen}
        onHideRemove={hideRemoveInvitation}
        currentInvitee={currentFriends[currentFriendId]?.email ?? ''}
      />
    </div>
  );
}

export type RemoveInvitationModalContentProps = {
  currentInvitee: string;
};

export function RemoveInvitationModalContent({
  currentInvitee,
}: RemoveInvitationModalContentProps): React.ReactElement {
  return (
    <div className="remove-invitation-modal-content">
      <div>
        <h2>Remove Access</h2>
        <p>
          Are you sure you want to remove the following user from having access
          schedule: <b>Primary</b>?
        </p>
        <p>
          User: <b>{currentInvitee}</b>
        </p>
        <p>
          This user will only gain access to this schedule if you send them
          another invitation
        </p>
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
      className="invitation-modal"
      onHide={onHide}
      buttons={[]}
      width={550}
    >
      <Button className="remove-close-button" onClick={onHide}>
        <FontAwesomeIcon icon={faXmark} size="xl" />
      </Button>
      <InvitationModalContent />
    </Modal>
  );
}

export type RemoveInvitationModalProps = {
  showRemove: boolean;
  onHideRemove: (confirm: boolean) => void;
  currentInvitee: string;
};

function RemoveInvitationModal({
  showRemove,
  onHideRemove,
  currentInvitee,
}: RemoveInvitationModalProps): React.ReactElement {
  return (
    <Modal
      show={showRemove}
      className="remove-invitation-modal"
      onHide={(): void => onHideRemove(false)}
      buttons={[
        { label: 'Remove', onClick: () => onHideRemove(true), cancel: true },
      ]}
      width={550}
    >
      <Button
        className="remove-close-button"
        onClick={(): void => onHideRemove(false)}
      >
        <FontAwesomeIcon icon={faXmark} size="xl" />
      </Button>
      <RemoveInvitationModalContent currentInvitee={currentInvitee} />
    </Modal>
  );
}
