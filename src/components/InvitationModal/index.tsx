import React, {
  KeyboardEvent,
  useCallback,
  useContext,
  useState,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import {
  faAngleDown,
  faAngleUp,
  faCheck,
  faCircle,
  faClose,
  faLink,
  faSpinner,
  faXmark,
  faPaperPlane,
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
  const expirationChoices = useMemo(
    (): Record<string, number> => ({
      Never: 1000,
      '1 week': 7,
      '1 day': 1,
      '1 hour': 0.0417,
    }),
    []
  );

  const [
    { currentVersion, term, allVersionNames, allFriends },
    { deleteFriendRecord },
  ] = useContext(ScheduleContext);
  const accountContext = useContext(AccountContext);
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  const input = useRef<HTMLInputElement>(null);
  const [validMessage, setValidMessage] = useState('');
  const [validClassName, setValidClassName] = useState('');
  const [linkMessage, setLinkMessage] = useState('');
  const [linkMessageClassName, setLinkMessageClassName] = useState('');
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
    if (!input.current || !/^\S+@\S+\.\S+$/.test(input.current.value)) {
      setValidMessage('Invalid Email');
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
        return Object.keys(versionFriends).some((f) => {
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
      setValidMessage(
        'Email has already accepted an invite for these versions'
      );
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
    setLinkMessage('');
    setLinkMessageClassName('');
    await getInvitationLink()
      .then((response) => {
        copy(response.data.link);
        setLinkLoading(false);
        setLinkMessage('');
        setLinkMessageClassName('');
      })
      .catch((err) => {
        const error = err as AxiosError;
        setLinkMessageClassName('link-failure');
        if (error.response) {
          const apiError = error.response.data as ApiErrorResponse;
          setLinkMessage(apiError.message);
          return;
        }
        setLinkMessage('Error creating link. Please try again later.');
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

  // delete friend from record of friends
  const handleDelete = useCallback(
    async (versionId: string, friendId: string): Promise<void> => {
      deleteFriendRecord(versionId, friendId);
      const data = JSON.stringify({
        IDToken: await (accountContext as SignedIn).getToken(),
        friendId,
        term,
        version: versionId,
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
              message: 'delete friend record from sender failed',
              source: err,
              fields: {
                user: (accountContext as SignedIn).id,
                friend: friendId,
                term,
                version: versionId,
              },
            })
          );
        });
    },
    [accountContext, deleteFriendRecord, term]
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
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        handleDelete(toRemoveInfo.version.id, toRemoveInfo.friendId);
      }
    },
    [toRemoveInfo, handleDelete]
  );

  // show a fake loader when options change
  useEffect(() => {
    setLinkLoading(true);
    setTimeout(() => {
      setLinkLoading(false);
    }, 200);
  }, [checkedSchedules, selectedExpiration]);

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
              value={emailInput}
            />
          </div>
          <button type="button" className="send-button" onClick={verifyEmail}>
            <FontAwesomeIcon icon={faPaperPlane} />
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
              linkLoading ? '' : 'link-generated',
              'copy-link-button'
            )}
            disabled={linkLoading}
            onClick={(): void => {
              createLink()
                .then(() => {
                  setLinkMessage('Link copied!');
                  setLinkMessageClassName('link-success');
                })
                .catch(() => {
                  setLinkMessage('Error copying link');
                  setLinkMessageClassName('link-failure');
                });
            }}
          >
            <FontAwesomeIcon
              className="copy-link-icon"
              icon={linkLoading ? faSpinner : faLink}
            />
            <text>Copy Link</text>
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
        <text className={classes('link-message', linkMessageClassName)}>
          {linkMessage}
        </text>
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
