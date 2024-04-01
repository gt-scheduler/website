import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { FriendContext, ScheduleContext } from '../../contexts';
import Button from '../Button';
import Modal from '../Modal';
import InvitationModal from '../InvitationModal';
import LoginModal from '../LoginModal';

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

    const email: string | null = searchParams.get('email');

    if (friends) {
      Object.keys(friends).forEach((f_i) => {
        if (friends[f_i] && friends[f_i]?.email === email) {
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

  const onHide = (): void => {
    navigate('/');
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

      <svg
        width="386"
        height="117"
        viewBox="0 0 386 117"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="modal-image"
      >
        <path
          d="M353.542 16.8174C348.852 11.7507 342.302 8.96045 335.072 8.96045C327.803 8.96045 321.231 11.7338 316.563 16.7692C311.845 21.86 309.546 28.7788 310.085 36.2499C311.155 50.9895 322.364 62.9799 335.072 62.9799C347.78 62.9799 358.969 50.9919 360.056 36.2547C360.603 28.8512 358.289 21.9468 353.542 16.8174ZM377.487 116.999H292.657C291.546 117.014 290.447 116.78 289.438 116.316C288.429 115.852 287.536 115.168 286.825 114.315C285.258 112.441 284.627 109.883 285.094 107.295C287.128 96.0041 293.476 86.5193 303.453 79.861C312.317 73.9502 323.545 70.697 335.072 70.697C346.599 70.697 357.827 73.9526 366.691 79.861C376.668 86.5169 383.016 96.0017 385.05 107.293C385.517 109.88 384.886 112.439 383.319 114.313C382.608 115.166 381.715 115.85 380.706 116.315C379.697 116.78 378.598 117.013 377.487 116.999Z"
          fill="#808080"
        />
        <path
          d="M68.5984 16.8174C63.9086 11.7507 57.3584 8.96045 50.1285 8.96045C42.8601 8.96045 36.2881 11.7338 31.62 16.7692C26.9013 21.86 24.6022 28.7788 25.1421 36.2499C26.2121 50.9895 37.4208 62.9799 50.1285 62.9799C62.8362 62.9799 74.0256 50.9919 75.1125 36.2547C75.6596 28.8512 73.346 21.9468 68.5984 16.8174ZM92.5437 116.999H7.71324C6.60289 117.014 5.50328 116.78 4.49442 116.316C3.48555 115.852 2.59281 115.168 1.88115 114.315C0.314673 112.441 -0.316736 109.883 0.150796 107.295C2.1848 96.0041 8.53263 86.5193 18.5099 79.861C27.3737 73.9502 38.6017 70.697 50.1285 70.697C61.6553 70.697 72.8833 73.9526 81.7471 79.861C91.7244 86.5169 98.0722 96.0017 100.106 107.293C100.574 109.88 99.9423 112.439 98.3758 114.313C97.6644 115.166 96.7718 115.85 95.7629 116.315C94.754 116.78 93.6543 117.013 92.5437 116.999Z"
          fill="#CCCBCB"
        />
        <path
          d="M121.861 82.4363H263.437"
          stroke="#808080"
          strokeWidth="8.96049"
          strokeLinecap="round"
          strokeDasharray="12.54 12.54"
        />
        <path
          d="M240.73 104.615L263.058 83.2106"
          stroke="#808080"
          strokeWidth="8.96049"
          strokeLinecap="round"
          strokeDasharray="12.54 12.54"
        />
        <path
          d="M264.016 45.5662L121.863 45.5662"
          stroke="#CCCBCB"
          strokeWidth="8.96049"
          strokeLinecap="round"
        />
        <path
          d="M144.662 23.2971L122.243 44.7885"
          stroke="#CCCBCB"
          strokeWidth="8.96049"
          strokeLinecap="round"
        />
        <circle cx="192.647" cy="43.647" r="15.647" fill="#808080" />
        <g clipPath="url(#clip0_12266_5070)">
          <path
            d="M190.279 34.9292C190.279 34.4389 189.883 34.0444 189.39 34.0444C188.898 34.0444 188.501 34.4389 188.501 34.9292V36.4038H187.019C185.712 36.4038 184.648 37.4618 184.648 38.7631V50.5597C184.648 51.8611 185.712 52.9191 187.019 52.9191H198.874C200.182 52.9191 201.245 51.8611 201.245 50.5597V38.7631C201.245 37.4618 200.182 36.4038 198.874 36.4038H197.392V34.9292C197.392 34.4389 196.996 34.0444 196.503 34.0444C196.01 34.0444 195.614 34.4389 195.614 34.9292V36.4038H190.279V34.9292ZM186.427 41.1224H199.467V50.5597C199.467 50.8841 199.2 51.1496 198.874 51.1496H187.019C186.693 51.1496 186.427 50.8841 186.427 50.5597V41.1224Z"
            fill="white"
          />
          <rect
            x="195.65"
            y="50.3325"
            width="2.53984"
            height="1.26992"
            transform="rotate(-180 195.65 50.3325)"
            fill="white"
          />
          <rect
            x="192.803"
            y="50.3325"
            width="2.53984"
            height="1.26992"
            transform="rotate(-180 192.803 50.3325)"
            fill="white"
          />
          <rect
            x="189.953"
            y="50.3325"
            width="2.53984"
            height="1.26992"
            transform="rotate(-180 189.953 50.3325)"
            fill="white"
          />
          <rect
            x="198.5"
            y="48.7881"
            width="2.53984"
            height="2.02501"
            transform="rotate(-180 198.5 48.7881)"
            fill="white"
          />
          <rect
            x="192.803"
            y="48.7881"
            width="2.53984"
            height="2.02501"
            transform="rotate(-180 192.803 48.7881)"
            fill="white"
          />
          <rect
            x="195.65"
            y="46.4885"
            width="2.53984"
            height="2.57416"
            transform="rotate(-180 195.65 46.4885)"
            fill="white"
          />
          <rect
            x="189.953"
            y="46.4885"
            width="2.53984"
            height="2.57416"
            transform="rotate(-180 189.953 46.4885)"
            fill="white"
          />
          <rect
            x="198.5"
            y="43.6396"
            width="2.53984"
            height="1.78475"
            transform="rotate(-180 198.5 43.6396)"
            fill="white"
          />
          <rect
            x="192.803"
            y="43.6396"
            width="2.53984"
            height="1.78475"
            transform="rotate(-180 192.803 43.6396)"
            fill="white"
          />
        </g>
        <defs>
          <clipPath id="clip0_12266_5070">
            <rect
              width="16.5967"
              height="18.8746"
              fill="white"
              transform="translate(184.648 34.0444)"
            />
          </clipPath>
        </defs>
      </svg>

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
