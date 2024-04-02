import React, {
  useState,
  useContext,
  useCallback,
  useId,
  useEffect,
} from 'react';
import {
  faPencil,
  faCircleXmark,
  faXmark,
  faPalette,
  faShareFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import axios from 'axios';

import { classes, getRandomColor } from '../../utils/misc';
import {
  ScheduleContext,
  FriendContext,
  AccountContext,
  SignedIn,
} from '../../contexts';
import Button from '../Button';
import Modal from '../Modal';
import { AutoFocusInput } from '../Select';
import { Palette } from '..';
import { ErrorWithFields, softError } from '../../log';
import { CLOUD_FUNCTION_BASE_URL } from '../../constants';
import InvitationModal from '../InvitationModal';
import ComparisonContainerShareBack from '../ComparisonContainerShareBack/ComparisonContainerShareBack';
import { ScheduleDeletionRequest } from '../../types';

import './stylesheet.scss';

export type SharedSchedule = {
  email: string;
  name: string;
  schedules: {
    id: string;
    name: string;
    color: string;
  }[];
};

export type DeleteInfo = {
  id: string;
  type: string;
  name: string;
  owner?: string;
  ownerName?: string;
} | null;

export type EditInfo = {
  id: string;
  owner?: string;
  type: string;
} | null;

export type ComparisonContainerProps = {
  handleCompareSchedules: (
    compare?: boolean,
    pinnedSchedules?: string[],
    pinSelf?: boolean,
    expanded?: boolean,
    overlaySchedules?: string[]
  ) => void;
  pinnedSchedules: string[];
  shareBackRemount: number;
};

export default function ComparisonContainer({
  handleCompareSchedules,
  pinnedSchedules,
  shareBackRemount,
}: ComparisonContainerProps): React.ReactElement {
  const [selected, setSelected] = useState<string[]>(pinnedSchedules);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteInfo>(null);
  const [editInfo, setEditInfo] = useState<EditInfo>(null);
  const [editValue, setEditValue] = useState('');
  const [paletteInfo, setPaletteInfo] = useState<string>();
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [invitationModalEmail, setInvitationModalEmail] = useState('');

  const [
    { allVersionNames, currentVersion, colorMap, term },
    { deleteVersion, renameVersion, patchSchedule },
  ] = useContext(ScheduleContext);

  const [{ friends }, { renameFriend }] = useContext(FriendContext);

  const accountContext = useContext(AccountContext);

  useEffect(() => {
    const newColorMap = { ...colorMap };
    allVersionNames.forEach((versionName) => {
      const version = versionName.id;
      if (!(version in newColorMap)) {
        newColorMap[version] = getRandomColor();
      }
    });
    if (!(currentVersion in newColorMap)) {
      newColorMap[currentVersion] = getRandomColor();
    }
    Object.entries(friends).forEach((friend) => {
      if (!(friend[0] in newColorMap)) {
        newColorMap[friend[0]] = getRandomColor();
      }
      Object.keys(friend[1].versions).forEach((schedule) => {
        if (!(schedule in newColorMap)) {
          newColorMap[schedule] = getRandomColor();
        }
      });
    });
    if (Object.keys(newColorMap).length !== Object.keys(colorMap).length) {
      patchSchedule({ colorMap: newColorMap });
    }
  }, [friends, currentVersion, colorMap, patchSchedule, allVersionNames]);

  const handleEdit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (editValue.trim() === '') return;
        if (editInfo?.type === 'Version') {
          renameVersion(editInfo?.id, editValue.trim());
        } else if (editInfo?.type === 'User') {
          renameFriend(editInfo?.id, editValue.trim());
        }
        setEditInfo(null);
        setEditValue('');
      }

      if (e.key === 'Escape') {
        setEditInfo(null);
        setEditValue('');
      }
    },
    [editInfo, editValue, renameVersion, renameFriend]
  );

  const handleNameEditOnBlur = useCallback(() => {
    if (editValue.trim() === '') return;
    if (editInfo?.type === 'User') {
      renameFriend(editInfo?.id, editValue.trim());
    }
    if (editInfo?.type === 'Version') {
      renameVersion(editInfo?.id, editValue.trim());
    }
    setEditInfo(null);
    setEditValue('');
  }, [editInfo, editValue, renameFriend, renameVersion]);

  const deleteSchedulesFromInvitee = useCallback(
    async (senderId: string, versions: string[]) => {
      const data = JSON.stringify({
        IDToken: await (accountContext as SignedIn).getToken(),
        peerUserId: senderId,
        term,
        versions,
        owner: false,
      } as ScheduleDeletionRequest);

      const friend = friends[senderId];
      if (friend) {
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
          .then(() => {
            const newColorMap = { ...colorMap };
            versions.forEach((schedule) => {
              delete newColorMap[schedule];
            });
            setSelected(
              selected.filter(
                (selectedId: string) =>
                  !Object.keys(friend.versions).includes(selectedId)
              )
            );
            patchSchedule({ colorMap: newColorMap });
            // updateFriendTermData((draft) => {
            //   delete draft.accessibleSchedules[senderId];
            // });
          })
          .catch((err) => {
            throw err;
          });
      }
    },
    [accountContext, term, colorMap, friends, patchSchedule, selected]
  );

  // remove all versions of a particular friend from user (invitee) view
  const handleRemoveFriend = useCallback(
    (ownerId: string) => {
      const friend = friends[ownerId];
      if (friend) {
        const versions = Object.keys(friend.versions);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        deleteSchedulesFromInvitee(ownerId, versions).catch((err) => {
          softError(
            new ErrorWithFields({
              message: 'Failed to delete user schedule',
              source: err,
              fields: {
                user: (accountContext as SignedIn).id,
                sender: ownerId,
                term,
                versions,
              },
            })
          );
        });
      }
    },
    [friends, deleteSchedulesFromInvitee, accountContext, term]
  );

  const handleRemoveSchedule = useCallback(
    (id: string, ownerId: string) => {
      deleteSchedulesFromInvitee(ownerId, [id]).catch((err) => {
        softError(
          new ErrorWithFields({
            message: 'Failed to delete user schedule',
            source: err,
            fields: {
              user: (accountContext as SignedIn).id,
              sender: ownerId,
              term,
              versions: [id],
            },
          })
        );
      });
    },
    [deleteSchedulesFromInvitee, accountContext, term]
  );

  const handleToggleSchedule = useCallback(
    (id: string) => {
      if (selected.includes(id)) {
        setSelected(selected.filter((selectedId: string) => selectedId !== id));
        handleCompareSchedules(
          undefined,
          selected.filter((selectedId: string) => selectedId !== id),
          undefined
        );
      } else {
        setSelected(selected.concat([id]));
        handleCompareSchedules(undefined, selected.concat([id]), undefined);
      }
    },
    [selected, handleCompareSchedules]
  );

  const setFriendScheduleColor = useCallback(
    (color: string, id: string) => {
      const newColorMap = { ...colorMap };
      newColorMap[id] = color;
      patchSchedule({ colorMap: newColorMap });
    },
    [colorMap, patchSchedule]
  );

  const sortedFriendsArray = Object.entries(friends).sort(
    ([, friendA], [, friendB]) => friendA.name.localeCompare(friendB.name)
  );

  return (
    <div className="comparison-container">
      <InvitationModal
        show={invitationModalOpen}
        onHide={(): void => {
          setInvitationModalOpen(false);
        }}
        inputEmail={invitationModalEmail}
      />
      <div className="comparison-body">
        <div className="comparison-content">
          <div className="my-schedule">
            <p className="my-schedule-title">My Schedule</p>
            {allVersionNames
              // .filter((version) => version.id === currentVersion)
              .map((version) => {
                return (
                  <ScheduleRow
                    key={version.id}
                    id={version.id}
                    type="Version"
                    onClick={(): void => {
                      handleToggleSchedule(version.id);
                    }}
                    checkboxColor={
                      selected.includes(version.id) ? colorMap[version.id] : ''
                    }
                    name={version.name}
                    // placeholder functions
                    handleEditSchedule={(): void => {
                      setEditInfo({
                        id: version.id,
                        type: 'Version',
                      });
                      setEditValue(version.name);
                    }}
                    handleRemoveSchedule={(): void => {
                      setDeleteConfirm({
                        id: version.id,
                        type: 'Version',
                        name: version.name,
                      });
                    }}
                    hasDelete={allVersionNames.length >= 2}
                    editOnChange={(
                      e: React.ChangeEvent<HTMLInputElement>
                    ): void => setEditValue(e.target.value)}
                    editOnKeyDown={handleEdit}
                    editInfo={editInfo}
                    setEditInfo={setEditInfo}
                    editValue={editValue}
                    hasPalette
                    setFriendScheduleColor={(color: string): void => {
                      setFriendScheduleColor(color, version.id);
                    }}
                    color={colorMap[version.id]}
                    paletteInfo={paletteInfo}
                    setPaletteInfo={setPaletteInfo}
                    handleNameEditOnBlur={handleNameEditOnBlur}
                    hoverFriendSchedule={(): void => {
                      handleCompareSchedules(
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        [version.id]
                      );
                    }}
                    unhoverFriendSchedule={(): void => {
                      handleCompareSchedules(
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        []
                      );
                    }}
                  />
                );
              })}
          </div>
          <div className="shared-schedules">
            <p className="content-title shared-with">Shared with me</p>
            {Object.keys(friends).length !== 0 ? (
              sortedFriendsArray.map(([friendId, friend]) => {
                return (
                  <div key={friendId} className="friend">
                    <ScheduleRow
                      // change id later on
                      id={friendId}
                      type="User"
                      hasCheck={false}
                      email={friend.email}
                      name={friend.name}
                      handleEditSchedule={(): void => {
                        setEditInfo({
                          id: friendId,
                          type: 'User',
                        });
                        setEditValue(friend.name);
                      }}
                      handleRemoveSchedule={(): void => {
                        setDeleteConfirm({
                          id: friendId,
                          type: 'User',
                          name: friend.name,
                        });
                      }}
                      hasTooltip
                      editOnChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ): void => setEditValue(e.target.value)}
                      editOnKeyDown={handleEdit}
                      editInfo={editInfo}
                      setEditInfo={setEditInfo}
                      editValue={editValue}
                      setInvitationModalEmail={setInvitationModalEmail}
                      setInvitationModalOpen={setInvitationModalOpen}
                      handleNameEditOnBlur={handleNameEditOnBlur}
                    />
                    <div className="friend-email">
                      <p>{friend.email}</p>
                    </div>
                    {Object.entries(friend.versions).map(
                      ([scheduleId, schedule]) => {
                        return (
                          <ScheduleRow
                            key={scheduleId}
                            id={scheduleId}
                            type="Schedule"
                            owner={friendId}
                            onClick={(): void =>
                              handleToggleSchedule(scheduleId)
                            }
                            checkboxColor={
                              selected.includes(scheduleId)
                                ? colorMap[scheduleId]
                                : ''
                            }
                            name={schedule.name}
                            handleEditSchedule={(): void => {
                              setEditInfo({
                                id: scheduleId,
                                owner: friendId,
                                type: 'Schedule',
                              });
                              setEditValue(schedule.name);
                            }}
                            handleRemoveSchedule={(): void => {
                              setDeleteConfirm({
                                id: scheduleId,
                                type: 'Schedule',
                                name: schedule.name,
                                owner: friendId,
                                ownerName: friend.name,
                              });
                            }}
                            hasPalette
                            hasEdit={false}
                            setFriendScheduleColor={(color: string): void => {
                              setFriendScheduleColor(color, scheduleId);
                            }}
                            color={colorMap[scheduleId]}
                            paletteInfo={paletteInfo}
                            setPaletteInfo={setPaletteInfo}
                            hoverFriendSchedule={(): void => {
                              handleCompareSchedules(
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                [scheduleId]
                              );
                            }}
                            unhoverFriendSchedule={(): void => {
                              handleCompareSchedules(
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                []
                              );
                            }}
                            handleNameEditOnBlur={handleNameEditOnBlur}
                          />
                        );
                      }
                    )}
                    <ComparisonContainerShareBack
                      friendId={friendId}
                      friendName={friend.name}
                      friendEmail={friend.email}
                      setModalEmail={setInvitationModalEmail}
                      setModalOpen={setInvitationModalOpen}
                      key={shareBackRemount}
                    />
                  </div>
                );
              })
            ) : (
              <div className="no-shared-schedules">
                <p className="info">
                  No schedules are currently shared with you.
                </p>
                <p className="info">
                  Accept invitations from other users to see their schedules on
                  this view.
                </p>
              </div>
            )}
          </div>
          <ComparisonModal
            deleteConfirm={deleteConfirm}
            setDeleteConfirm={setDeleteConfirm}
            deleteVersion={deleteVersion}
            handleRemoveFriend={handleRemoveFriend}
            handleRemoveSchedule={handleRemoveSchedule}
          />
        </div>
      </div>
    </div>
  );
}

type ScheduleRowProps = {
  id: string;
  type: string;
  owner?: string;
  hasCheck?: boolean;
  onClick?: () => void;
  checkboxColor?: string;
  email?: string;
  name: string;
  handleEditSchedule: () => void;
  handleRemoveSchedule: () => void;
  setInvitationModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  setInvitationModalEmail?: React.Dispatch<React.SetStateAction<string>>;
  hasPalette?: boolean;
  hasEdit?: boolean;
  hasDelete?: boolean;
  hasTooltip?: boolean;
  setFriendScheduleColor?: (color: string) => void;
  color?: string;
  paletteInfo?: string;
  setPaletteInfo?: (info: string) => void;
  editOnChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  editOnKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  editInfo?: EditInfo;
  setEditInfo?: (info: EditInfo) => void;
  editValue?: string;
  hoverFriendSchedule?: () => void;
  unhoverFriendSchedule?: () => void;
  handleNameEditOnBlur?: () => void;
};

function ScheduleRow({
  id,
  type,
  owner,
  hasCheck = true,
  onClick,
  checkboxColor,
  email,
  name,
  handleEditSchedule,
  handleRemoveSchedule,
  hasPalette = false,
  hasEdit = true,
  hasDelete = true,
  hasTooltip = false,
  setFriendScheduleColor,
  color,
  paletteInfo,
  setPaletteInfo,
  editOnChange,
  editOnKeyDown,
  editInfo,
  setEditInfo,
  editValue,
  setInvitationModalOpen,
  setInvitationModalEmail,
  hoverFriendSchedule,
  unhoverFriendSchedule,
  handleNameEditOnBlur,
}: ScheduleRowProps): React.ReactElement {
  const tooltipId = useId();
  const [tooltipHover, setTooltipHover] = useState(false);
  const [divHover, setDivHover] = useState(false);
  const [showPaletteTooltip, setShowPaletteTooltip] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showEditTooltip, setShowEditTooltip] = useState(false);
  const [showRemoveTooltip, setShowRemoveTooltip] = useState(false);

  const edit =
    hasEdit &&
    editInfo != null &&
    editInfo.type === type &&
    editInfo.id === id &&
    editInfo.owner === owner;

  const palette = hasPalette && paletteInfo === id;

  return (
    <div
      className="schedule-row"
      onMouseEnter={(): void => {
        if (type === 'Schedule' || type === 'Version') {
          hoverFriendSchedule?.();
        }
      }}
      onMouseLeave={(): void => {
        if (type === 'Schedule' || type === 'Version') {
          unhoverFriendSchedule?.();
        }
      }}
    >
      <div
        className={classes(
          'checkbox-container',
          edit && 'editing',
          type === 'Schedule' && 'schedule-checkbox'
        )}
        onMouseEnter={(): void => setDivHover(true)}
        onMouseLeave={(): void => setDivHover(false)}
      >
        {hasCheck && (
          <div
            className={classes('checkbox', type === 'Schedule' && 'indented')}
            onClick={onClick}
            style={{ backgroundColor: checkboxColor }}
          />
        )}
        {setEditInfo && edit && (
          <AutoFocusInput
            className={classes('edit-input', hasCheck && 'check')}
            value={editValue ?? ''}
            onChange={editOnChange}
            placeholder={name}
            onKeyDown={editOnKeyDown}
            onBlur={handleNameEditOnBlur}
          />
        )}
        {!edit && (
          <>
            <div
              id={tooltipId}
              className={classes('name', hasCheck && 'check')}
              onMouseEnter={(): void => setTooltipHover(true)}
              onMouseLeave={(): void => setTooltipHover(false)}
              onClick={onClick}
            >
              <div
                className={classes(
                  type === 'User' && 'friend-name',
                  type !== 'User' && checkboxColor !== '' && 'checked',
                  type !== 'User' && 'schedule-name'
                )}
              >
                <p>{name}</p>
              </div>
              {hasTooltip && email !== name && (
                <ReactTooltip
                  key={id}
                  anchorId={tooltipId}
                  className="tooltip"
                  variant="dark"
                  isOpen={tooltipHover}
                  setIsOpen={setTooltipHover}
                  delayShow={20}
                  delayHide={100}
                  // key={deviceHasHover ? 0 : 1}
                  // events={deviceHasHover ? ['hover'] : []}
                >
                  <p>{email}</p>
                </ReactTooltip>
              )}
            </div>
            <div className="spacing" />
          </>
        )}
        {(divHover || edit) && hasPalette && setPaletteInfo && (
          <div
            onMouseEnter={(): void => setShowPaletteTooltip(true)}
            onMouseLeave={(): void => setShowPaletteTooltip(false)}
            id={`${tooltipId}-palette`}
          >
            <Button
              className="icon"
              onClick={(): void => setPaletteInfo(palette ? '' : id)}
              key={`${id}-palette`}
            >
              <FontAwesomeIcon icon={faPalette} size="xs" />
            </Button>
            <ReactTooltip
              key={`palette-tooltip-${id}`}
              anchorId={`${tooltipId}-palette`}
              place="top"
              isOpen={showPaletteTooltip}
              setIsOpen={setShowPaletteTooltip}
              className="tooltip"
              variant="dark"
            >
              Edit Color
            </ReactTooltip>
          </div>
        )}
        {(divHover || edit) &&
          hasEdit &&
          setInvitationModalOpen !== undefined &&
          setInvitationModalEmail !== undefined &&
          email && (
            <div
              onMouseEnter={(): void => setShowShareTooltip(true)}
              onMouseLeave={(): void => setShowShareTooltip(false)}
              id={`${tooltipId}-share`}
            >
              <Button
                className="icon"
                onClick={(): void => {
                  setInvitationModalEmail(email);
                  setInvitationModalOpen(true);
                }}
                key={`${id}-share`}
                data-for={`share-tooltip-${id}`}
                data-tip="Share"
              >
                <FontAwesomeIcon icon={faShareFromSquare} size="xs" />
              </Button>
              <ReactTooltip
                key={`share-tooltip-${id}`}
                anchorId={`${tooltipId}-share`}
                place="top"
                isOpen={showShareTooltip}
                setIsOpen={setShowShareTooltip}
                className="tooltip"
                variant="dark"
              >
                Share Back
              </ReactTooltip>
            </div>
          )}
        {(divHover || edit) && hasEdit && (
          <div
            onMouseEnter={(): void => setShowEditTooltip(true)}
            onMouseLeave={(): void => setShowEditTooltip(false)}
            id={`${tooltipId}-edit`}
          >
            <Button
              className="icon"
              onClick={handleEditSchedule}
              key={`${id}-edit`}
            >
              <FontAwesomeIcon icon={faPencil} size="xs" />
            </Button>
            <ReactTooltip
              key={`edit-tooltip-${id}`}
              anchorId={`${tooltipId}-edit`}
              place="top"
              isOpen={showEditTooltip}
              setIsOpen={setShowEditTooltip}
              className="tooltip"
              variant="dark"
            >
              Edit
            </ReactTooltip>
          </div>
        )}
        {(divHover || edit) && hasDelete && (
          <div
            onMouseEnter={(): void => setShowRemoveTooltip(true)}
            onMouseLeave={(): void => setShowRemoveTooltip(false)}
            id={`${tooltipId}-delete`}
          >
            <Button
              className="icon"
              onClick={handleRemoveSchedule}
              key={`${id}-delete`}
            >
              <FontAwesomeIcon icon={faCircleXmark} size="xs" />
            </Button>
            <ReactTooltip
              key={`delete-tooltip-${id}`}
              anchorId={`${tooltipId}-delete`}
              place="top"
              isOpen={showRemoveTooltip}
              setIsOpen={setShowRemoveTooltip}
              className="tooltip"
              variant="dark"
            >
              Remove
            </ReactTooltip>
          </div>
        )}
      </div>
      {hasPalette && palette && setFriendScheduleColor && setPaletteInfo && (
        <Palette
          className={classes('palette', type === 'Schedule' && 'indented')}
          onSelectColor={setFriendScheduleColor}
          color={color ?? null}
          onMouseLeave={(): void => setPaletteInfo('')}
        />
      )}
    </div>
  );
}

type ComparisonModalProps = {
  deleteConfirm: DeleteInfo;
  setDeleteConfirm: (deleteConfirm: DeleteInfo) => void;
  deleteVersion: (id: string) => void;
  handleRemoveFriend: (id: string) => void;
  handleRemoveSchedule: (id: string, owner: string) => void;
};

function ComparisonModal({
  deleteConfirm,
  setDeleteConfirm,
  deleteVersion,
  handleRemoveFriend,
  handleRemoveSchedule,
}: ComparisonModalProps): React.ReactElement {
  return (
    <Modal
      className="shared-schedule-modal"
      show={deleteConfirm != null}
      onHide={(): void => setDeleteConfirm(null)}
      buttons={[
        {
          label: 'Remove',
          onClick: (): void => {
            if (deleteConfirm != null) {
              if (deleteConfirm.type === 'Version') {
                deleteVersion(deleteConfirm.id);
              } else if (deleteConfirm.type === 'User') {
                handleRemoveFriend(deleteConfirm.id);
              } else {
                handleRemoveSchedule(
                  deleteConfirm.id,
                  deleteConfirm.owner ?? ''
                );
              }
            }
            setDeleteConfirm(null);
          },
        },
      ]}
      preserveChildrenWhileHiding
    >
      <Button
        className="cancel-button"
        onClick={(): void => setDeleteConfirm(null)}
      >
        <FontAwesomeIcon icon={faXmark} size="xl" />
      </Button>
      {deleteConfirm?.type === 'Version' && (
        <div style={{ textAlign: 'center' }}>
          <h2>Delete confirmation</h2>
          <p>
            Are you sure you want to delete schedule &ldquo;
            {deleteConfirm?.name ?? '<unknown>'}&rdquo;?
          </p>
        </div>
      )}
      {deleteConfirm?.type === 'User' && (
        <div style={{ textAlign: 'center' }}>
          <h2>Remove User</h2>
          <p>
            Are you sure you want to remove the following user&apos;s schedules
            from your view?
          </p>
          <p>
            User: <b>{deleteConfirm?.name}</b>
          </p>
          <p>
            You will not be able to see any of their schedules unless the owner
            sends another invite for each one.
          </p>
        </div>
      )}
      {deleteConfirm?.type === 'Schedule' && (
        <div style={{ textAlign: 'center' }}>
          <h2>Remove Schedule</h2>
          <p>
            Are you sure you want to remove the following schedule from your
            view?
          </p>
          <p>
            Schedule: <b>{deleteConfirm?.name}</b> <br />
            Owner: <b>{deleteConfirm?.ownerName}</b>
          </p>
          <p>
            You will not be able to see it unless the owner sends another
            invite.
          </p>
        </div>
      )}
    </Modal>
  );
}
