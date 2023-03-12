import React, { useState, useContext, useCallback, useId } from 'react';
import {
  faPencil,
  faCircleXmark,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip as ReactTooltip } from 'react-tooltip';

import { classes } from '../../utils/misc';
import { ScheduleContext } from '../../contexts';
import Button from '../Button';
import Modal from '../Modal';
import { AutoFocusInput } from '../Select';

import './stylesheet.scss';

export type SharedSchedule = {
  id: string;
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
} | null;

export type EditInfo = {
  id: string;
  owner?: string;
  type: string;
} | null;

export default function ComparisonContainer(): React.ReactElement {
  const [compare, setCompare] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteInfo>(null);
  const [editInfo, setEditInfo] = useState<EditInfo>(null);
  const [editValue, setEditValue] = useState('');

  const [{ allVersionNames }, { deleteVersion, renameVersion }] =
    useContext(ScheduleContext);

  const [sharedSchedules, setSharedSchedules] = useState<SharedSchedule[]>([
    {
      id: 'friend1@gatech.edu',
      name: 'SuperLongFriendNameThatShouldBreakEverythingIncludingModalSoIHaveToMakeThisSuperLongYay',
      schedules: [
        { id: '1', name: 'Main', color: '#760000' },
        {
          id: '2',
          name: 'SuperLongScheduleNameThatBreaksEverythingIncludingModalSoIHaveToMakeThisSuperLongYay',
          color: '#760076',
        },
      ],
    },
    {
      id: 'friend2@gatech.edu',
      name: 'friend2',
      schedules: [
        { id: '3', name: 'Primary', color: '#007600' },
        { id: '4', name: 'New Name', color: '#000076' },
        { id: '5', name: 'Alternative', color: '#007676' },
        { id: '6', name: 'Primary', color: '#007600' },
        { id: '7', name: 'New Name', color: '#000076' },
        { id: '8', name: 'Alternative', color: '#007676' },
        { id: '9', name: 'Primary', color: '#007600' },
        { id: '10', name: 'New Name', color: '#000076' },
        { id: '11', name: 'Alternative', color: '#007676' },
        { id: '12', name: 'Alternative', color: '#007676' },
        { id: '13', name: 'Primary', color: '#007600' },
        { id: '14', name: 'New Name', color: '#000076' },
        { id: '15', name: 'Alternative', color: '#007676' },
        { id: '16', name: 'Primary', color: '#007600' },
        { id: '17', name: 'New Name', color: '#000076' },
        { id: '18', name: 'Alternative', color: '#007676' },
        { id: '19', name: 'Alternative', color: '#007676' },
      ],
    },
    {
      id: 'friend3@yahoo.com',
      name: 'friend3@yahoo.com',
      schedules: [{ id: '12', name: 'Preferred', color: '#562738' }],
    },
  ]);

  // placeholder callbacks
  const handleEdit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (editValue.trim() === '') return;
        if (editInfo?.type === 'Version') {
          renameVersion(editInfo?.id, editValue.trim());
        } else if (editInfo?.type === 'User') {
          setSharedSchedules(
            sharedSchedules.map((friend) => {
              if (friend.id === editInfo?.id) {
                return {
                  id: friend.id,
                  name: editValue.trim(),
                  schedules: friend.schedules,
                };
              }
              return friend;
            })
          );
        } else {
          setSharedSchedules(
            sharedSchedules.map((friend) => {
              if (friend.id === editInfo?.owner) {
                return {
                  id: friend.id,
                  name: friend.name,
                  schedules: friend.schedules.map((schedule) => {
                    if (schedule.id === editInfo?.id) {
                      return {
                        id: schedule.id,
                        name: editValue.trim(),
                        color: schedule.color,
                      };
                    }
                    return schedule;
                  }),
                };
              }
              return friend;
            })
          );
        }
        setEditInfo(null);
        setEditValue('');
      }

      if (e.key === 'Escape') {
        setEditInfo(null);
        setEditValue('');
      }
    },
    [editInfo, editValue, sharedSchedules, renameVersion]
  );

  const handleRemoveFriend = useCallback(
    (id: string) => {
      setSharedSchedules(sharedSchedules.filter((friend) => friend.id !== id));
    },
    [sharedSchedules]
  );

  const handleRemoveSchedule = useCallback(
    (id: string, owner?: string) => {
      setSharedSchedules(
        sharedSchedules
          .map((friend) => {
            if (friend.id === owner) {
              return {
                id: friend.id,
                name: friend.name,
                schedules: friend.schedules.filter(
                  (schedule) => schedule.id !== id
                ),
              };
            }
            return friend;
          })
          .filter((friend) => friend.schedules.length !== 0)
      );
    },
    [sharedSchedules]
  );

  const handleToggleSchedule = useCallback(
    (id: string) => {
      if (selected.includes(id)) {
        setSelected(selected.filter((selectedId: string) => selectedId !== id));
      } else {
        setSelected(selected.concat([id]));
      }
    },
    [selected]
  );

  return (
    <div className="comparison-container">
      <div className="comparison-body">
        <div className="comparison-header">
          <p className="header-title">Compare Schedules</p>
          <p className="header-text">{compare ? 'On' : 'Off'}</p>
          <label className="switch" htmlFor="comparison-checkbox">
            <input
              type="checkbox"
              id="comparison-checkbox"
              onClick={(): void => setCompare(!compare)}
            />
            <div className="slider round" />
          </label>
        </div>
        <div className="comparison-content">
          <div className="my-schedules">
            <p className="content-title">My Schedules</p>
            {allVersionNames.map((version) => {
              return (
                <ScheduleRow
                  key={version.id}
                  id={version.id}
                  type="Version"
                  onClick={(): void => handleToggleSchedule(version.id)}
                  checkboxColor={selected.includes(version.id) ? '#FFFFFF' : ''}
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
                />
              );
            })}
          </div>
          <div className="shared-schedules">
            <p className="content-title">Shared with me</p>
            {sharedSchedules.map((friend) => {
              return (
                <div key={friend.id} className="friend">
                  <ScheduleRow
                    // change id later on
                    id={friend.id}
                    type="User"
                    hasCheck={false}
                    name={friend.name}
                    handleEditSchedule={(): void => {
                      setEditInfo({
                        id: friend.id,
                        type: 'User',
                      });
                      setEditValue(friend.name);
                    }}
                    handleRemoveSchedule={(): void => {
                      setDeleteConfirm({
                        id: friend.id,
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
                  />
                  {friend.schedules.map((schedule) => {
                    return (
                      <ScheduleRow
                        key={schedule.id}
                        id={schedule.id}
                        type="Schedule"
                        owner={friend.id}
                        onClick={(): void => handleToggleSchedule(schedule.id)}
                        checkboxColor={
                          selected.includes(schedule.id) ? schedule.color : ''
                        }
                        name={schedule.name}
                        handleEditSchedule={(): void => {
                          setEditInfo({
                            id: schedule.id,
                            owner: friend.id,
                            type: 'Schedule',
                          });
                          setEditValue(schedule.name);
                        }}
                        handleRemoveSchedule={(): void => {
                          setDeleteConfirm({
                            id: schedule.id,
                            type: 'Schedule',
                            name: schedule.name,
                            owner: friend.id,
                          });
                        }}
                        hasEdit={false}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          <ComparisonModal
            deleteConfirm={deleteConfirm}
            setDeleteConfirm={setDeleteConfirm}
            deleteVersion={deleteVersion}
            handleRemoveFriend={handleRemoveFriend}
            handleRemoveSchedule={handleRemoveSchedule}
          />
        </div>
        <div
          className={classes('comparison-overlay', 'left', compare && 'open')}
        />
        <div
          className={classes('comparison-overlay', 'right', !compare && 'open')}
        />
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
  name: string;
  handleEditSchedule: () => void;
  handleRemoveSchedule: () => void;
  hasEdit?: boolean;
  hasDelete?: boolean;
  hasTooltip?: boolean;
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
  name,
  handleEditSchedule,
  handleRemoveSchedule,
  hasEdit = true,
  hasDelete = true,
  hasTooltip = false,
  editOnChange,
  editOnKeyDown,
  editInfo,
  setEditInfo,
  editValue,
}: ScheduleRowProps): React.ReactElement {
  const tooltipId = useId();
  const [hover, setHover] = useState(false);

  const edit =
    editInfo != null &&
    editInfo.type === type &&
    editInfo.id === id &&
    editInfo.owner === owner;

  return (
    <div className="checkbox-container">
      {hasCheck && (
        <div
          className={classes('checkbox', type === 'Schedule' && 'indented')}
          onClick={onClick}
          style={{ backgroundColor: checkboxColor }}
        />
      )}
      {hasEdit && setEditInfo && editValue && edit && (
        <AutoFocusInput
          className={classes('edit-input', hasCheck && 'check')}
          value={editValue}
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
            onMouseEnter={(): void => setHover(true)}
            onMouseLeave={(): void => setHover(false)}
          >
            <p>{name}</p>
            {hasTooltip && id !== name && (
              <ReactTooltip
                key={id}
                anchorId={tooltipId}
                className="tooltip"
                variant="dark"
                isOpen={hover}
                setIsOpen={setHover}
                delayShow={20}
                delayHide={100}
                // key={deviceHasHover ? 0 : 1}
                // events={deviceHasHover ? ['hover'] : []}
              >
                <p>{id}</p>
              </ReactTooltip>
            )}
          </div>
          <div className="spacing" />
        </>
      )}
      {hasEdit && (
        <Button
          className="icon"
          onClick={handleEditSchedule}
          key={`${id}-edit`}
        >
          <FontAwesomeIcon icon={faPencil} size="xs" />
        </Button>
      )}
      {hasDelete && (
        <Button
          className="icon"
          onClick={handleRemoveSchedule}
          key={`${id}-delete`}
        >
          <FontAwesomeIcon icon={faCircleXmark} size="xs" />
        </Button>
      )}
    </div>
  );
}

type ComparisonModalProps = {
  deleteConfirm: DeleteInfo;
  setDeleteConfirm: (deleteConfirm: DeleteInfo) => void;
  deleteVersion: (id: string) => void;
  handleRemoveFriend: (id: string) => void;
  handleRemoveSchedule: (id: string, owner?: string) => void;
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
                handleRemoveSchedule(deleteConfirm.id, deleteConfirm.owner);
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
            Owner: <b>{deleteConfirm?.owner}</b>
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
