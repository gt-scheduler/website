import React, { useState, useContext, useCallback } from 'react';
import { classes } from '../../utils/misc';
import { ScheduleContext } from '../../contexts';
import { faPencil, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button, { ButtonProps } from '../Button';
import Modal from '../Modal';
import './stylesheet.scss';

export type SharedSchedule = {
  name: string;
  schedules: {
    id: string;
    name: string;
    color: string;
  }[];
};

export default function ComparisonContainer(): React.ReactElement {
  const [compare, setCompare] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: string;
    name: string;
    owner?: string;
  } | null>(null);

  const [{ allVersionNames }, { deleteVersion, renameVersion }] =
    useContext(ScheduleContext);

  // placeholder callbacks
  const handleEditSchedule = useCallback(() => {
    console.log('edit friend schedule');
  }, []);

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
      name: 'John Smith',
      schedules: [
        { id: '1', name: 'Main', color: '#760000' },
        { id: '2', name: 'Backup', color: '#760076' },
      ],
    },
    {
      name: 'friend2@gatech.edu',
      schedules: [
        { id: '3', name: 'Primary', color: '#007600' },
        { id: '4', name: 'New Name', color: '#000076' },
        { id: '5', name: 'Alternative', color: '#007676' },
      ],
    },
    {
      name: 'friend3@yahoo.com',
      schedules: [{ id: '6', name: 'Preferred', color: '#562738' }],
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
                  id={version.id}
                  onClick={(): void => handleToggleSchedule(version.id)}
                  checkboxColor={selected.includes(version.id) ? '#FFFFFF' : ''}
                  name={version.name}
                  // placeholder functions
                  handleEditSchedule={handleEditSchedule}
                  handleRemoveSchedule={(): void => {
                    setDeleteConfirm({
                      id: version.id,
                      type: 'Version',
                      name: version.name,
                    });
                  }}
                  hasDelete={allVersionNames.length >= 2}
                />
              );
            })}
          </div>
          <div className="shared-schedules">
            <p className="content-title">Shared with me</p>
            {sharedSchedules.map((friend) => {
              return (
                <div className="friend">
                  <ScheduleRow
                    // change id later on
                    id={friend.name}
                    hasCheck={false}
                    name={friend.name}
                    handleEditSchedule={handleEditSchedule}
                    handleRemoveSchedule={(): void => {
                      setDeleteConfirm({
                        id: friend.name,
                        type: 'User',
                        name: friend.name,
                      });
                    }}
                  />
                  {friend.schedules.map((schedule, i) => {
                    return (
                      <ScheduleRow
                        id={schedule.id}
                        className="indented"
                        onClick={(): void => handleToggleSchedule(schedule.id)}
                        checkboxColor={
                          selected.includes(schedule.id) ? schedule.color : ''
                        }
                        name={schedule.name}
                        handleEditSchedule={handleEditSchedule}
                        handleRemoveSchedule={(): void => {
                          setDeleteConfirm({
                            id: schedule.id,
                            type: 'Schedule',
                            name: schedule.name,
                            owner: friend.name,
                          });
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div
            className={classes('comparison-overlay', 'left', compare && 'open')}
          />
          <div
            className={classes(
              'comparison-overlay',
              'right',
              !compare && 'open'
            )}
          />
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
      </div>
    </div>
  );
}

type ScheduleRowProps = {
  id: string;
  className?: string;
  hasCheck?: boolean;
  onClick?: () => void;
  checkboxColor?: string;
  name: string;
  handleEditSchedule: () => void;
  handleRemoveSchedule: () => void;
  hasDelete?: boolean;
};

function ScheduleRow({
  id,
  className,
  hasCheck = true,
  onClick,
  checkboxColor,
  name,
  handleEditSchedule,
  handleRemoveSchedule,
  hasDelete = true,
}: ScheduleRowProps): React.ReactElement {
  return (
    <div className={classes('checkbox-container', className)}>
      {hasCheck && (
        <div
          className="checkbox"
          onClick={onClick}
          style={{ backgroundColor: checkboxColor }}
        />
      )}
      <p>{name}</p>
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
