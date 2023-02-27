import React, { useState, useContext, useCallback, useId } from 'react';
import { classes } from '../../utils/misc';
import { ScheduleContext } from '../../contexts';
import { faPencil, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button, { ButtonProps } from '../Button';
import { Tooltip as ReactTooltip } from 'react-tooltip';
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

  // placeholder callbacks
  const handleEdit = useCallback(() => {
    console.log('edit friend schedule');
    console.log(editValue);
  }, [editValue]);

  const handleRemoveSchedule = useCallback((id: string) => {
    console.log('remove friend schedule', id);
  }, []);

  const handleRemoveFriend = useCallback((id: string) => {
    console.log('remove user friend', id);
  }, []);

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

  const sharedSchedules: SharedSchedule[] = [
    {
      id: 'friend1@gatech.edu',
      name: 'John Smith',
      schedules: [
        { id: '1', name: 'Main', color: '#760000' },
        { id: '2', name: 'Backup', color: '#760076' },
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
  ];

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
            {allVersionNames.map((version, i) => {
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
                        id: friend.name,
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
                    editValue={editValue}
                  />
                  {friend.schedules.map((schedule, i) => {
                    return (
                      <ScheduleRow
                        key={schedule.id}
                        id={schedule.id}
                        type="Schedule"
                        className="indented"
                        onClick={(): void => handleToggleSchedule(schedule.id)}
                        checkboxColor={
                          selected.includes(schedule.id) ? schedule.color : ''
                        }
                        name={schedule.name}
                        handleEditSchedule={(): void => {
                          setEditInfo({
                            id: schedule.id,
                            type: 'Schedule',
                          });
                          setEditValue(schedule.name);
                        }}
                        handleRemoveSchedule={(): void => {
                          setDeleteConfirm({
                            id: schedule.id,
                            type: 'Schedule',
                            name: schedule.name,
                            owner: friend.name,
                          });
                        }}
                        editOnChange={(
                          e: React.ChangeEvent<HTMLInputElement>
                        ): void => setEditValue(e.target.value)}
                        editOnKeyDown={handleEdit}
                        editInfo={editInfo}
                        editValue={editValue}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          <Modal
            show={deleteConfirm != null}
            onHide={(): void => setDeleteConfirm(null)}
            buttons={[
              {
                label: 'Cancel',
                cancel: true,
                onClick: (): void => setDeleteConfirm(null),
              },
              {
                label: 'Remove',
                onClick: (): void => {
                  if (deleteConfirm != null) {
                    if (deleteConfirm.type === 'Version') {
                      deleteVersion(deleteConfirm.id);
                    } else if (deleteConfirm.type === 'User') {
                      handleRemoveFriend(deleteConfirm.id);
                    } else {
                      handleRemoveSchedule(deleteConfirm.id);
                    }
                  }
                  setDeleteConfirm(null);
                },
              },
            ]}
            preserveChildrenWhileHiding
          >
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
                  Are you sure you want to remove the following user&apos;s
                  schedules from your view?
                </p>
                <p>
                  User: <b>{deleteConfirm?.name}</b>
                </p>
                <p>
                  You will not be able to see any of their schedules unless the
                  owner sends another invite for each one.
                </p>
              </div>
            )}
            {deleteConfirm?.type === 'Schedule' && (
              <div style={{ textAlign: 'center' }}>
                <h2>Remove Schedule</h2>
                <p>
                  Are you sure you want to remove the following schedule from
                  your view?
                </p>
                <p>
                  Schedule: <b>{deleteConfirm?.name}</b>
                </p>
                <p>
                  Owner: <b>{deleteConfirm?.owner}</b>
                </p>
                <p>
                  You will not be able to see it unless the owner sends another
                  invite.
                </p>
              </div>
            )}
          </Modal>
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
  className?: string;
  hasCheck?: boolean;
  onClick?: () => void;
  checkboxColor?: string;
  name: string;
  handleEditSchedule: () => void;
  handleRemoveSchedule: () => void;
  hasDelete?: boolean;
  hasTooltip?: boolean;
  editOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  editOnKeyDown: () => void;
  editInfo: EditInfo;
  editValue: string;
};

function ScheduleRow({
  id,
  type,
  className,
  hasCheck = true,
  onClick,
  checkboxColor,
  name,
  handleEditSchedule,
  handleRemoveSchedule,
  hasDelete = true,
  hasTooltip = false,
  editOnChange,
  editOnKeyDown,
  editInfo,
  editValue,
}: ScheduleRowProps): React.ReactElement {
  const tooltipId = useId();
  const [hover, setHover] = useState(false);

  const edit = editInfo != null && editInfo.type === type && editInfo.id === id;

  return (
    <div className={classes('checkbox-container', className)}>
      {hasCheck && (
        <div
          className="checkbox"
          onClick={onClick}
          style={{ backgroundColor: checkboxColor }}
        />
      )}
      {edit && (
        <AutoFocusInput
          className="edit-input"
          value={editValue}
          onChange={editOnChange}
          placeholder={name}
          onKeyDown={editOnKeyDown}
        />
      )}
      {!edit && (
        <>
          <div
            id={tooltipId}
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
      <Button className="icon" onClick={handleEditSchedule} key={`${id}-edit`}>
        <FontAwesomeIcon icon={faPencil} size="xs" />
      </Button>
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
