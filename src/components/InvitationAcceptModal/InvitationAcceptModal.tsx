import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { FriendContext, ScheduleContext } from '../../contexts';
import Button from '../Button';
import Modal from '../Modal';
import InvitationModal from '../InvitationModal';
import LoginModal from '../LoginModal';
import SuccesfulInvitationImage from '../SuccesfulInvitationImage';

import './stylesheet.scss';

export type InvitationAcceptModalProps = {
  handleCompareSchedules: (
    compare?: boolean,
    pinnedSchedules?: string[],
    pinSelf?: boolean,
    expanded?: boolean
  ) => void;
  setShareBackRemount: React.Dispatch<React.SetStateAction<number>>;
};

export default function InvitationAcceptModal({
  handleCompareSchedules,
  setShareBackRemount,
}: InvitationAcceptModalProps): React.ReactElement {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [invitationModalOpen, setInvitationModalOpen] =
    useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [friendID, setFriendID] = useState<string>();
  const [email, setEmail] = useState<string>();

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const [{ friends }] = useContext(FriendContext);
  const [{ allFriends, allVersionNames }, { setTerm }] =
    useContext(ScheduleContext);

  const schedulesShared = useMemo(() => {
    return Object.keys(allFriends)
      .map((version_id) => {
        if (
          friendID &&
          allFriends[version_id] &&
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          friendID in allFriends[version_id]!
        ) {
          const versionName = allVersionNames.filter(
            (v) => v.id === version_id
          );
          if (versionName.length > 0) {
            return versionName[0]?.name;
          }
        }
        return undefined;
      })
      .filter((v) => v) as string[];
  }, [friendID, allFriends, allVersionNames]);

  const schedulesReceived = useMemo((): string[] | undefined => {
    if (friendID) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return Object.keys(friends[friendID]!.versions)
        .map((version_id): string | undefined => {
          return friends[friendID]?.versions[version_id]?.name;
        })
        .filter((name) => name) as string[];
    }
    return undefined;
  }, [friendID, friends]);

  const friendName = useMemo((): string | undefined => {
    if (friendID) {
      return friends[friendID]?.name;
    }
    return undefined;
  }, [friendID, friends]);

  useEffect(() => {
    if (
      !searchParams.get('inviteId') ||
      !searchParams.get('status') ||
      !searchParams.get('email')
    ) {
      setModalOpen(false);
      return;
    }

    const tempEmail: string | null = searchParams.get('email');

    if (friends) {
      Object.keys(friends).forEach((f_i) => {
        if (friends[f_i] && friends[f_i]?.email === tempEmail) {
          setFriendID(f_i);
        }
      });

      setModalOpen(true);
    }

    if (
      searchParams.get('status') === 'success' &&
      searchParams.get('term') !== null
    ) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      setTerm(searchParams.get('term')!);
    }
  }, [searchParams, friends, setTerm]);

  useEffect(() => {
    if (searchParams.get('email') !== null && searchParams.get('email')) {
      setEmail(searchParams.get('email') ?? '');
    }
  }, [searchParams]);

  const onHide = (): void => {
    setModalOpen(!modalOpen);
    navigate('/');
    handleCompareSchedules(true, undefined, undefined, true);
  };

  return (
    <>
      <InvitationModal
        show={invitationModalOpen}
        onHide={(): void => {
          setInvitationModalOpen(false);
        }}
        inputEmail={email}
      />

      <LoginModal
        show={loginModalOpen}
        onHide={(): void => {
          setLoginModalOpen(false);
        }}
      />

      <Modal
        show={modalOpen}
        onHide={onHide}
        width={700}
        buttonPrompt="Would you like to share your schedule back?"
        buttons={
          searchParams.get('status') === 'not-logged-in'
            ? [
                {
                  label: 'Login',
                  onClick: (): void => {
                    onHide();
                    setLoginModalOpen(true);
                  },
                },
              ]
            : schedulesShared &&
              schedulesShared.length !== allVersionNames.length &&
              searchParams.get('status') === 'success'
            ? [
                {
                  label: 'No',
                  onClick: onHide,
                  cancel: true,
                },
                {
                  label: 'Share Back',
                  onClick: (): void => {
                    onHide();
                    localStorage.setItem(
                      `share-back-invitation-${friendID ?? ''}`,
                      'true'
                    );
                    setShareBackRemount(1);
                    setInvitationModalOpen(true);
                  },
                },
              ]
            : []
        }
      >
        <Button className="remove-close-button" onClick={onHide}>
          <FontAwesomeIcon icon={faXmark} size="xl" />
        </Button>
        {searchParams.get('status') === 'success' ? (
          <SuccessContent
            name={friendName ?? ''}
            email={searchParams.get('email') ?? ''}
            schedulesReceived={schedulesReceived ?? []}
            schedulesSent={schedulesShared ?? []}
          />
        ) : (
          <FailureContent error={searchParams.get('status') ?? ''} />
        )}
      </Modal>
    </>
  );
}

type SuccessContentProps = {
  email: string;
  name: string;
  schedulesReceived: string[];
  schedulesSent: string[];
};

function SuccessContent({
  name,
  email,
  schedulesReceived,
  schedulesSent,
}: SuccessContentProps): React.ReactElement {
  return (
    <div className="invitation-accept-modal-content">
      <div className="heading">
        You have successfully added a new schedule to your view!
      </div>

      <SuccesfulInvitationImage className="modal-image" />

      <div className="sub-heading">
        You will now be able to see {email}&apos;s schedule!
      </div>
      <div className="sub-heading">
        Schedules {`${name}`} has shared with you:
        {schedulesReceived &&
          schedulesReceived.map((version, i) => {
            if (i !== schedulesReceived.length - 1) {
              return (
                <span>
                  {' '}
                  <b>{version}</b>,
                </span>
              );
            }
            return (
              <span>
                {' '}
                <b>{version}</b>
              </span>
            );
          })}
        {schedulesReceived?.length === 0 ? (
          <span>
            <b> None</b>
          </span>
        ) : null}
      </div>
      <div className="sub-heading">
        Schedules you have shared with {`${name}`}:
        {schedulesSent &&
          schedulesSent.map((version, i) => {
            if (i !== schedulesSent.length - 1) {
              return (
                <span>
                  {' '}
                  <b>{version}</b>,
                </span>
              );
            }
            return (
              <span>
                {' '}
                <b>{version}</b>
              </span>
            );
          })}
        {schedulesSent?.length === 0 ? (
          <span>
            <b> None</b>
          </span>
        ) : null}
      </div>
    </div>
  );
}

type FailureContentProps = {
  error: string;
};

function FailureContent({ error }: FailureContentProps): React.ReactElement {
  return (
    <div className="invitation-accept-modal-content">
      <img src="/mascot.png" alt="buzz" className="buzz-image" />
      <div className="heading">Failed to add new schedules</div>
      <div className="error-sub-heading">
        {error === 'invalid-invite'
          ? 'Invalid Invite'
          : error === 'invite-expired'
          ? 'Invite Expired'
          : error === 'not-logged-in'
          ? 'Not Logged In'
          : error === 'already-accepted-all'
          ? 'Schedules Already Accepted'
          : "Something's wrong here.."}
      </div>
      <div className="error-message">
        {error === 'invalid-invite' ? (
          <span>
            The invite request is <u>invalid</u>, please ask the user for a new
            invite.
          </span>
        ) : error === 'invite-expired' ? (
          <span>
            The invite request has <u>expired</u>, please ask the user for a new
            invite.
          </span>
        ) : error === 'not-logged-in' ? (
          <span>
            Login and click on the invite link again to add your friend&apos;s
            schedule to your view.
          </span>
        ) : error === 'already-accepted-all' ? (
          <span>You have already accepted these schedules from the user!</span>
        ) : (
          <span>
            An unknown error occurred on our end, please ask the user for a new
            invite!
          </span>
        )}
      </div>
    </div>
  );
}
