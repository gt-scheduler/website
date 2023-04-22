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
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip as ReactTooltip } from 'react-tooltip';

import { classes, getRandomColor } from '../../utils/misc';
import { ScheduleContext, FriendContext } from '../../contexts';
import Button from '../Button';
import Modal from '../Modal';
import { AutoFocusInput } from '../Select';
import { Palette } from '..';

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
    pinSelf?: boolean
  ) => void;
  pinnedSchedules: string[];
  pinSelf: boolean;
};

export default function ComparisonContainer({
  handleCompareSchedules,
  pinnedSchedules,
  pinSelf,
}: ComparisonContainerProps): React.ReactElement {
  const [selected, setSelected] = useState<string[]>(pinnedSchedules);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteInfo>(null);
  const [editInfo, setEditInfo] = useState<EditInfo>(null);
  const [editValue, setEditValue] = useState('');
  const [paletteInfo, setPaletteInfo] = useState<string>();
  const [scheduleSelected, setScheduleSelected] = useState(pinSelf);

  const [
    { allVersionNames, currentVersion, colorMap },
    { deleteVersion, renameVersion, patchSchedule },
  ] = useContext(ScheduleContext);

  const [{ friends }, { updateFriendTermData, renameFriend }] =
    useContext(FriendContext);

  useEffect(() => {
    const newColorMap = { ...colorMap };
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
  }, [friends, currentVersion, colorMap, patchSchedule]);

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

  const handleRemoveFriend = useCallback(
    (id: string) => {
      const friend = friends[id];
      if (friend) {
        const newColorMap = { ...colorMap };
        Object.keys(friend.versions).forEach((schedule) => {
          delete newColorMap[schedule];
        });
        setSelected(
          selected.filter(
            (selectedId: string) =>
              !Object.keys(friend.versions).includes(selectedId)
          )
        );
        patchSchedule({ colorMap: newColorMap });
        updateFriendTermData((draft) => {
          delete draft.accessibleSchedules[id];
        });
      }
    },
    [friends, selected, colorMap, patchSchedule, updateFriendTermData]
  );

  const handleRemoveSchedule = useCallback(
    (id: string, owner: string) => {
      updateFriendTermData((draft) => {
        if (draft.accessibleSchedules[owner]?.length === 1) {
          delete draft.accessibleSchedules[owner];
        } else {
          draft.accessibleSchedules[owner] =
            draft.accessibleSchedules[owner]?.filter(
              (schedule) => schedule !== id
            ) ?? [];
        }
      });
      const newColorMap = { ...colorMap };
      delete newColorMap[id];
      patchSchedule({ colorMap: newColorMap });
      setSelected(selected.filter((selectedId: string) => selectedId !== id));
    },
    [selected, colorMap, updateFriendTermData, patchSchedule]
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

  return (
    <div className="comparison-container">
      <div className="comparison-body">
        <div className="comparison-content">
          <div className="my-schedule">
            <p className="content-title">My Schedule</p>
            {allVersionNames
              .filter((version) => version.id === currentVersion)
              .map((version) => {
                return (
                  <ScheduleRow
                    key={version.id}
                    id={version.id}
                    type="Version"
                    onClick={(): void => {
                      setScheduleSelected(!scheduleSelected);
                      handleCompareSchedules(
                        undefined,
                        undefined,
                        !scheduleSelected
                      );
                    }}
                    checkboxColor={scheduleSelected ? colorMap[version.id] : ''}
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
                  />
                );
              })}
          </div>
          <div className="shared-schedules">
            <p className="content-title">Shared with me</p>
            {Object.keys(friends).length !== 0 ? (
              Object.entries(friends).map((friend) => {
                return (
                  <div key={friend[0]} className="friend">
                    <ScheduleRow
                      // change id later on
                      id={friend[0]}
                      type="User"
                      hasCheck={false}
                      email={friend[1].email}
                      name={friend[1].name}
                      handleEditSchedule={(): void => {
                        setEditInfo({
                          id: friend[0],
                          type: 'User',
                        });
                        setEditValue(friend[1].name);
                      }}
                      handleRemoveSchedule={(): void => {
                        setDeleteConfirm({
                          id: friend[0],
                          type: 'User',
                          name: friend[1].name,
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
                    />
                    {Object.entries(friend[1].versions).map((schedule) => {
                      return (
                        <ScheduleRow
                          key={schedule[0]}
                          id={schedule[0]}
                          type="Schedule"
                          owner={friend[0]}
                          onClick={(): void =>
                            handleToggleSchedule(schedule[0])
                          }
                          checkboxColor={
                            selected.includes(schedule[0])
                              ? colorMap[schedule[0]]
                              : ''
                          }
                          name={schedule[1].name}
                          handleEditSchedule={(): void => {
                            setEditInfo({
                              id: schedule[0],
                              owner: friend[0],
                              type: 'Schedule',
                            });
                            setEditValue(schedule[1].name);
                          }}
                          handleRemoveSchedule={(): void => {
                            setDeleteConfirm({
                              id: schedule[0],
                              type: 'Schedule',
                              name: schedule[1].name,
                              owner: friend[0],
                              ownerName: friend[1].name,
                            });
                          }}
                          hasPalette
                          hasEdit={false}
                          setFriendScheduleColor={(color: string): void => {
                            setFriendScheduleColor(color, schedule[0]);
                          }}
                          color={colorMap[schedule[0]]}
                          paletteInfo={paletteInfo}
                          setPaletteInfo={setPaletteInfo}
                        />
                      );
                    })}
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
}: ScheduleRowProps): React.ReactElement {
  const tooltipId = useId();
  const [tooltipHover, setTooltipHover] = useState(false);
  const [divHover, setDivHover] = useState(false);

  const edit =
    hasEdit &&
    editInfo != null &&
    editInfo.type === type &&
    editInfo.id === id &&
    editInfo.owner === owner;

  const palette = hasPalette && paletteInfo === id;

  return (
    <div className="schedule-row">
      <div
        className={classes('checkbox-container', edit && 'editing')}
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
            onBlur={(): void => setEditInfo(null)}
          />
        )}
        {!edit && (
          <>
            <div
              id={tooltipId}
              className={classes('name', hasCheck && 'check')}
              onMouseEnter={(): void => setTooltipHover(true)}
              onMouseLeave={(): void => setTooltipHover(false)}
            >
              <p>{name}</p>
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
          <Button
            className="icon"
            onClick={(): void => setPaletteInfo(palette ? '' : id)}
            key={`${id}-palette`}
          >
            <FontAwesomeIcon icon={faPalette} size="xs" />
          </Button>
        )}
        {(divHover || edit) && hasEdit && (
          <Button
            className="icon"
            onClick={handleEditSchedule}
            key={`${id}-edit`}
          >
            <FontAwesomeIcon icon={faPencil} size="xs" />
          </Button>
        )}
        {(divHover || edit) && hasDelete && (
          <Button
            className="icon"
            onClick={handleRemoveSchedule}
            key={`${id}-delete`}
          >
            <FontAwesomeIcon icon={faCircleXmark} size="xs" />
          </Button>
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
