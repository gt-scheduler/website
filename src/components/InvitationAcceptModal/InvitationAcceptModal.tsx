import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams } from 'react-router-dom';
import React, { useContext, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useLocalStorageState from 'use-local-storage-state';
import { FriendContext, ScheduleContext } from '../../contexts';
import Button from '../Button';
import Modal from '../Modal';
import InvitationModal from '../InvitationModal';
import LoginModal from '../LoginModal';
import { FriendShareData } from '../../data/types';

import './stylesheet.scss';

export type InvitationAcceptModalProps = {
  handleCompareSchedules: (
    compare?: boolean,
    pinnedSchedules?: string[],
    pinSelf?: boolean,
    expanded?: boolean
  ) => void;
};

export default function InvitationAcceptModal({
  handleCompareSchedules,
}: InvitationAcceptModalProps): React.ReactElement {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [invitationModalOpen, setInvitationModalOpen] =
    useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  const [schedulesShared, setSchedulesShared] = useState<string[]>();
  const [schedulesReceived, setSchedulesReceived] = useState<string[]>();
  const [friendName, setFriendName] = useState<string>();

  const [searchParams] = useSearchParams();

  const [{ friends }] = useContext(FriendContext);
  const [{ allFriends, allVersionNames }] = useContext(ScheduleContext);

  const [hasSeen, setHasSeen] = useLocalStorageState(
    `redirect-invitation-modal-${searchParams.get('inviteId') ?? ''}`,
    {
      defaultValue: false,
      storageSync: true,
    }
  );

  useEffect(() => {
    // if (
    //   !searchParams.get('inviteId') ||
    //   !searchParams.get('status') ||
    //   !searchParams.get('email') ||
    //   hasSeen
    // ) {
    //   setModalOpen(false);
    //   return;
    // }

    const email: string | null = searchParams.get('email');

    let friendID = '';

    if (friends) {
      Object.keys(friends).forEach((f_i) => {
        if (friends[f_i] && friends[f_i]?.email === email) {
          friendID = f_i;
          setFriendName(friends[f_i]?.name);
          const received = Object.keys(friends[f_i]!.versions)
            .map((version_id): string | undefined => {
              return friends[f_i]?.versions[version_id]?.name;
            })
            .filter((name) => name) as string[];

          setSchedulesReceived(received);
        }
      });

      if (friendID !== '') {
        const sent = Object.keys(allFriends)
          .map((version_id) => {
            if (allFriends[version_id] && friendID in allFriends[version_id]!) {
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

        setSchedulesShared(sent);
      }

      setModalOpen(true);
    }
  }, [searchParams, hasSeen, friends]);

  const onHide = (): void => {
    setHasSeen(true);
    setModalOpen(!modalOpen);
    handleCompareSchedules(true, undefined, undefined, true);
  };

  return (
    <>
      <InvitationModal
        show={invitationModalOpen}
        onHide={(): void => {
          setInvitationModalOpen(false);
        }}
        inputEmail={searchParams.get('email') ?? undefined}
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
            : undefined
        }
      >
        <Button className="remove-close-button" onClick={onHide}>
          <FontAwesomeIcon icon={faXmark} size="xl" />
        </Button>
        {searchParams.get('status') === 'success' ? (
          <SuccessContent
            name={friendName ?? ''}
            email={searchParams.get('email') ?? ''}
            onHide={onHide}
            setInvitationModalOpen={setInvitationModalOpen}
            schedulesReceived={schedulesReceived}
            schedulesSent={schedulesShared}
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
  onHide: () => void;
  setInvitationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  schedulesReceived: string[] | undefined;
  schedulesSent: string[] | undefined;
};

function SuccessContent({
  name,
  email,
  onHide,
  setInvitationModalOpen,
  schedulesReceived,
  schedulesSent,
}: SuccessContentProps): React.ReactElement {
  return (
    <div className="invitation-accept-modal-content">
      <div className="heading">
        You have successfully added a new schedule to your view!
      </div>

      <img src="/scheduled.png" alt="ok" className="modal-image" />
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
      </div>
      <div className="modal-bottom">
        <div>Would you like to share your schedule back?</div>

        <div className="button-row">
          <button type="submit" className="no-button" onClick={onHide}>
            No
          </button>
          <button
            type="submit"
            className="share-button"
            onClick={(): void => {
              onHide();
              setInvitationModalOpen(true);
            }}
          >
            Share Back
          </button>
        </div>
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
      <div className="heading">Failed to add new schedule</div>
      <div className="error-sub-heading">
        {error === 'invalid-invite'
          ? 'Invalid Invite'
          : error === 'invite-expired'
          ? 'Invite Expired'
          : error === 'not-logged-in'
          ? 'Not Logged In'
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
