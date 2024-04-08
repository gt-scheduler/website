import React, {
  KeyboardEvent,
  useCallback,
  useContext,
  useState,
  useRef,
  useMemo,
} from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import {
  faAngleDown,
  faAngleUp,
  faCheck,
  faCircle,
  faClose,
  faLink,
  faXmark,
  faPaperPlane,
  faXmarkCircle,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios, { AxiosError, AxiosResponse } from 'axios';
import copy from 'copy-to-clipboard';

import { ApiErrorResponse, FriendShareData } from '../../data/types';
import { ScheduleContext } from '../../contexts';
import { DESKTOP_BREAKPOINT, CLOUD_FUNCTION_BASE_URL } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';
import { classes } from '../../utils/misc';
import Modal from '../Modal';
import Button from '../Button';
import { AccountContext, SignedIn } from '../../contexts/account';
import { ErrorWithFields, softError } from '../../log';
import Spinner from '../Spinner';
import { ScheduleDeletionRequest } from '../../types';
import useDeepCompareEffect from '../../hooks/useDeepCompareEffect';

import './stylesheet.scss';

/**
 * Inner content of the invitation modal.
 */
export type InvitationModalContentProps = {
  inputEmail?: string;
};

export function InvitationModalContent({
  inputEmail,
}: InvitationModalContentProps): React.ReactElement {
  const [removeInvitationOpen, setRemoveInvitationOpen] = useState(false);
  const [toRemoveInfo, setToRemoveInfo] = useState({
    version: { id: '', name: '' },
    friendId: '',
  });
  const [otherSchedulesVisible, setOtherSchedulesVisible] = useState(false);
  const [expirationDropdownVisible, setExpirationDropdownVisible] =
    useState(false);
  const [selectedExpiration, setSelectedExpiration] = useState('Never');

  // All choices sent in seconds
  const expirationChoices = useMemo(
    (): Record<string, number> => ({
      Never: 356 * 24 * 3600,
      '1 week': 7 * 24 * 3600,
      '1 day': 24 * 3600,
      '1 hour': 3600,
    }),
    []
  );

  const [{ currentVersion, term, allVersionNames, allFriends }] =
    useContext(ScheduleContext);
  const accountContext = useContext(AccountContext);
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  const input = useRef<HTMLInputElement>(null);
  const [validMessage, setValidMessage] = useState('');
  const [validClassName, setValidClassName] = useState('');
  const [emailIcon, setEmailIcon] = useState('send');
  const [linkButtonClassName, setLinkButtonClassName] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [checkedSchedules, setCheckedSchedules] = useState([currentVersion]);
  // const [invitationLink, setInvitationLink] = useState('');
  const [emailInput, setEmailInput] = useState(inputEmail ?? '');

  const redirectURL = useMemo(
    () => window.location.href.split('/#')[0] ?? '/',
    []
  );

  const handleChangeSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmailInput(e.target.value);
      setValidMessage('');
      setValidClassName('');
      setEmailIcon('send');
    },
    [setEmailInput]
  );

  const sendInvitation = useCallback(async (): Promise<void> => {
    const IdToken = await (accountContext as SignedIn).getToken();
    const data = JSON.stringify({
      IDToken: IdToken,
      term,
      versions: checkedSchedules,
      redirectURL,
      friendEmail: input.current?.value,
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
  }, [accountContext, term, redirectURL, checkedSchedules]);

  // verify email with a regex and send invitation if valid
  const verifyEmail = useCallback((): void => {
    if (!input.current?.value) {
      return;
    }

    setEmailIcon('spinner');
    if (!/^\S+@\S+\.\S+$/.test(input.current.value)) {
      setValidMessage('Invalid email, please try again!');
      setEmailIcon('send');
      return setValidClassName('invalid-email');
    }
    const numNotAccepted = Object.entries(allFriends).reduce(
      (acc, [versionId]) => {
        if (!checkedSchedules.includes(versionId)) {
          return acc;
        }
        const versionFriends = allFriends[versionId] as Record<
          string,
          FriendShareData
        >;

        // if friend accepted, don't increment numNotAccepted
        return Object.keys(versionFriends ?? {}).some((f) => {
          return (
            versionFriends[f]?.email === input.current?.value &&
            (versionFriends[f]?.status === 'Accepted' ||
              versionFriends[f]?.status === 'Pending')
          );
        })
          ? acc
          : acc + 1;
      },
      0
    );

    if (numNotAccepted === 0) {
      setValidMessage('User has already been invited to selected schedules.');
      setEmailIcon('send');
      return setValidClassName('invalid-email');
    }

    sendInvitation()
      .then(() => {
        if (input.current) {
          input.current.value = '';
        }
        setValidMessage('Invite successfully sent!');
        setValidClassName('valid-email');
        setEmailInput('');
        setEmailIcon('checkmark');
      })
      .catch((err) => {
        setValidClassName('invalid-email');
        setEmailIcon('send');
        const error = err as AxiosError;
        if (error.response) {
          const apiError = error.response.data as ApiErrorResponse;
          setValidMessage(apiError.message);
          return;
        }
        setValidMessage('Error sending invitation. Please try again later.');
        softError(
          new ErrorWithFields({
            message: 'send email invitation failed',
            source: err,
            fields: {
              user: (accountContext as SignedIn).id,
              friendEmail: input.current?.value,
              term,
              versionIds: checkedSchedules,
            },
          })
        );
      });
  }, [accountContext, sendInvitation, allFriends, checkedSchedules, term]);

  const getInvitationLink = useCallback(async (): Promise<
    AxiosResponse<{ link: string }>
  > => {
    const IdToken = await (accountContext as SignedIn).getToken();
    const data = JSON.stringify({
      IDToken: IdToken,
      term,
      versions: checkedSchedules,
      redirectURL,
      validFor: expirationChoices[selectedExpiration],
    });
    return axios.post(
      `${CLOUD_FUNCTION_BASE_URL}/createFriendInvitationLink`,
      `data=${data}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  }, [
    accountContext,
    term,
    redirectURL,
    checkedSchedules,
    expirationChoices,
    selectedExpiration,
  ]);

  const createLink = useCallback(async (): Promise<void> => {
    setLinkLoading(true);
    setLinkButtonClassName('');
    await getInvitationLink()
      .then((response) => {
        copy(response.data.link);
      })
      .catch((err) => {
        setLinkButtonClassName('link-failure');
        softError(
          new ErrorWithFields({
            message: 'invite link creation failed',
            source: err,
            fields: {
              user: (accountContext as SignedIn).id,
              term,
              versionIds: checkedSchedules,
              validFor: selectedExpiration,
            },
          })
        );
        throw err;
      });
  }, [
    accountContext,
    term,
    getInvitationLink,
    checkedSchedules,
    selectedExpiration,
  ]);

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

  // delete invitation or remove schedules from already accepted invitation
  const handleDelete = useCallback(
    async (versionId: string, friendId: string): Promise<void> => {
      const data = JSON.stringify({
        IDToken: await (accountContext as SignedIn).getToken(),
        peerUserId: friendId,
        term,
        versions: [versionId],
        owner: true,
      } as ScheduleDeletionRequest);
      axios
        .post(
          `${CLOUD_FUNCTION_BASE_URL}/deleteSharedSchedule`,
          `data=${data}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
        .catch((err) => {
          throw err;
        });
    },
    [accountContext, term]
  );

  function showRemoveInvitation(
    version: { id: string; name: string },
    friendId: string
  ): void {
    setRemoveInvitationOpen(true);
    setToRemoveInfo({ version, friendId });
  }

  // delete friend from record of friends and close modal
  const hideRemoveInvitation = useCallback(
    (confirm: boolean) => {
      setRemoveInvitationOpen(false);
      if (confirm) {
        handleDelete(toRemoveInfo.version.id, toRemoveInfo.friendId).catch(
          (err) => {
            softError(
              new ErrorWithFields({
                message: 'delete friend record from sender failed',
                source: err,
                fields: {
                  user: (accountContext as SignedIn).id,
                  friend: toRemoveInfo.friendId,
                  term,
                  version: toRemoveInfo.version.id,
                },
              })
            );
          }
        );
      }
    },
    [toRemoveInfo, handleDelete, accountContext, term]
  );

  // show a fake loader when options change
  useDeepCompareEffect(() => {
    setLinkButtonClassName('');
    setLinkLoading(true);
    setTimeout(() => {
      setLinkLoading(false);
    }, 200);
  }, [checkedSchedules, selectedExpiration]);

  return (
    <div className={classes('invitation-modal-content', mobile && 'mobile')}>
      <div className="top-block">
        <p className="modal-title">Share Schedule</p>
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
              placeholder="Enter user's email address"
              list="recent-invites"
              onFocus={handleChangeSearch}
              onKeyDown={handleKeyDown}
              onChange={handleChangeSearch}
              value={emailInput}
            />
          </div>
          <button
            type="button"
            className={classes(
              'send-button',
              !emailInput.trim() && 'disabled-send-button',
              emailIcon === 'spinner' && 'email-button-spinner',
              emailIcon === 'checkmark' && 'email-button-checkmark'
            )}
            onClick={verifyEmail}
          >
            {emailIcon === 'send' && <FontAwesomeIcon icon={faPaperPlane} />}
            {emailIcon === 'spinner' && <Spinner size="small" />}
            {emailIcon === 'checkmark' && (
              <FontAwesomeIcon
                className="email-button-check-icon"
                icon={faCheck}
              />
            )}
          </button>
        </div>
        <div className={validClassName}>{validMessage}</div>
        <div className="share-schedule-checkboxes">
          {allVersionNames.slice(0, 3).map((v) => (
            <ShareScheduleCheckbox
              checkedSchedules={checkedSchedules}
              version={v}
              setCheckedSchedules={setCheckedSchedules}
              isOther={false}
            />
          ))}
          {allVersionNames.length > 3 && (
            <div>
              <div
                className="other-schedules-button"
                onClick={(): void =>
                  setOtherSchedulesVisible(!otherSchedulesVisible)
                }
              >
                <p className="other-schedules-text">Other</p>
                <FontAwesomeIcon
                  icon={otherSchedulesVisible ? faAngleUp : faAngleDown}
                />
              </div>
              {otherSchedulesVisible && (
                <div
                  className="intercept"
                  onClick={(): void => setOtherSchedulesVisible(false)}
                />
              )}
              <div className="other-schedules-list">
                {otherSchedulesVisible &&
                  allVersionNames
                    .slice(3)
                    .map((v) => (
                      <ShareScheduleCheckbox
                        checkedSchedules={checkedSchedules}
                        version={v}
                        setCheckedSchedules={setCheckedSchedules}
                        isOther
                      />
                    ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <hr className="divider" />
      <div className="invited-users">
        {allVersionNames.map((v) => {
          return (
            <div>
              <p>
                Users Invited to View <strong>{v.name}</strong>
              </p>
              {allFriends[v.id] &&
              Object.keys(allFriends[v.id] as Record<string, FriendShareData>)
                .length !== 0 ? (
                <div className="shared-emails" key="email">
                  {Object.entries(
                    allFriends[v.id] as Record<string, FriendShareData>
                  ).map(([friendId, friend]) => (
                    <div className="email-and-status" id={friend.email}>
                      <div
                        className={classes(
                          'individual-shared-email',
                          friend.status
                        )}
                      >
                        <p className="email-text">{friend.email}</p>
                        <Button
                          className="button-remove"
                          onClick={(): void => {
                            showRemoveInvitation(v, friendId);
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
                <div className="no-invited-users">
                  No friends have been invited
                </div>
              )}{' '}
            </div>
          );
        })}
      </div>
      <hr className="divider" />
      <div className="modal-footer">
        <div className="link-options">
          <button
            type="button"
            className={classes(
              'copy-link-button',
              linkLoading ? '' : 'link-generated',
              linkButtonClassName
            )}
            disabled={linkLoading}
            onClick={(): void => {
              createLink()
                .then(() => {
                  setLinkButtonClassName('link-success');
                  setLinkLoading(false);
                })
                .catch(() => {
                  setLinkButtonClassName('link-failure');
                  setLinkLoading(false);
                });
            }}
          >
            <div
              className={classes('link-icon-container', linkButtonClassName)}
            >
              {linkLoading && <Spinner className="link-spinner" size="small" />}
              {!linkLoading && linkButtonClassName === '' && (
                <FontAwesomeIcon icon={faLink} />
              )}
              {!linkLoading && linkButtonClassName === 'link-success' && (
                <FontAwesomeIcon icon={faCircleCheck} />
              )}
              {!linkLoading && linkButtonClassName === 'link-failure' && (
                <FontAwesomeIcon icon={faXmarkCircle} />
              )}
            </div>
            <text className={linkButtonClassName}>
              {linkButtonClassName === '' && 'Share with link'}
              {linkButtonClassName === 'link-success' && 'Link copied!'}
              {linkButtonClassName === 'link-failure' && 'Error occurred'}
            </text>
          </button>
          <div className="expiration">
            <div className="expiration-display">
              <text>Link expires:</text>
              <div
                className="current-expiration"
                onClick={(): void => {
                  setExpirationDropdownVisible(!expirationDropdownVisible);
                }}
              >
                <text>{selectedExpiration}</text>
                <FontAwesomeIcon
                  icon={expirationDropdownVisible ? faAngleDown : faAngleUp}
                />
              </div>
            </div>
            {expirationDropdownVisible && (
              <div
                className="intercept"
                onClick={(): void => setExpirationDropdownVisible(false)}
              />
            )}
            <div className="expiration-select">
              {expirationDropdownVisible &&
                Object.keys(expirationChoices).map((exp) => (
                  <text
                    className="expiration-option"
                    onClick={(): void => {
                      setSelectedExpiration(exp);
                      setExpirationDropdownVisible(false);
                    }}
                  >
                    {exp}
                  </text>
                ))}
            </div>
          </div>
        </div>
      </div>
      <RemoveInvitationModal
        showRemove={removeInvitationOpen}
        onHideRemove={hideRemoveInvitation}
        versionName={toRemoveInfo.version.name}
        currentInvitee={
          toRemoveInfo.version.id === ''
            ? ''
            : (
                allFriends[toRemoveInfo.version.id] as Record<
                  string,
                  FriendShareData
                >
              )[toRemoveInfo.friendId]?.email ?? ''
        }
      />
    </div>
  );
}

export type RemoveInvitationModalContentProps = {
  versionName: string;
  currentInvitee: string;
};

export function RemoveInvitationModalContent({
  versionName,
  currentInvitee,
}: RemoveInvitationModalContentProps): React.ReactElement {
  return (
    <div className="remove-invitation-modal-content">
      <div>
        <h2>Remove Access</h2>
        <p>
          Are you sure you want to remove the following user from having access
          schedule: <b>{versionName}</b>?
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
  inputEmail?: string;
};

/**
 * Component that can be used to show the invitaion modal.
 */
export default function InvitationModal({
  show,
  onHide,
  inputEmail,
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
      <InvitationModalContent inputEmail={inputEmail} />
    </Modal>
  );
}

export type RemoveInvitationModalProps = {
  showRemove: boolean;
  onHideRemove: (confirm: boolean) => void;
  versionName: string;
  currentInvitee: string;
};

function RemoveInvitationModal({
  showRemove,
  onHideRemove,
  versionName,
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
      <RemoveInvitationModalContent
        versionName={versionName}
        currentInvitee={currentInvitee}
      />
    </Modal>
  );
}

export type ShareScheduleCheckboxProps = {
  checkedSchedules: string[];
  setCheckedSchedules: React.Dispatch<React.SetStateAction<string[]>>;
  version: { id: string; name: string };
  isOther: boolean;
};

function ShareScheduleCheckbox({
  checkedSchedules,
  setCheckedSchedules,
  version,
  isOther,
}: ShareScheduleCheckboxProps): React.ReactElement {
  return (
    <div
      className={
        isOther
          ? classes('checkbox-and-label', 'other-checkbox-and-label')
          : 'checkbox-and-label'
      }
      onClick={(): void => {
        const newChecked = checkedSchedules;
        if (!newChecked.includes(version.id)) {
          newChecked.push(version.id);
        } else if (newChecked.length > 1) {
          newChecked.splice(newChecked.indexOf(version.id), 1);
        }
        setCheckedSchedules([...newChecked]);
      }}
    >
      <FontAwesomeIcon
        className={
          checkedSchedules.includes(version.id)
            ? classes('share-schedule-checkbox', version.id, 'schedule-checked')
            : classes('share-schedule-checkbox', version.id)
        }
        icon={faCheck}
      />
      <p className="checkbox-label">{version.name}</p>
    </div>
  );
}
