import React, { useState, useContext, useCallback } from 'react';
import { classes } from '../../utils/misc';
import { ScheduleContext } from '../../contexts';
import { faPencil, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button, { ButtonProps } from '../Button';
import './stylesheet.scss';

export type SharedSchedule = {
  name: string;
  schedules: {
    name: string;
    color: string;
  }[];
};

export default function ComparisonContainer(): React.ReactElement {
  const [compare, setCompare] = useState(false);
  const [{ allVersionNames }, { deleteVersion, renameVersion }] =
    useContext(ScheduleContext);

  const handleEditSchedule = useCallback(() => {
    console.log('edit friend schedule');
  }, []);

  const handleRemoveSchedule = useCallback(() => {
    console.log('remove friend schedule');
  }, []);

  const sharedSchedules: SharedSchedule[] = [
    {
      name: 'John Smith',
      schedules: [
        { name: 'Main', color: '#760000' },
        { name: 'Backup', color: '#760076' },
      ],
    },
    {
      name: 'friend2@gatech.edu',
      schedules: [
        { name: 'Primary', color: '#007600' },
        { name: 'New Name', color: '#000076' },
        { name: 'Alternative', color: '#007676' },
      ],
    },
    {
      name: 'friend3@yahoo.com',
      schedules: [{ name: 'Preferred', color: '#562738' }],
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
                <div className="checkbox-container">
                  <div className="checkbox" />
                  {/* style={selected ? {background-color: {versionBgColor}} : {}} */}
                  <p>{version.name}</p>
                  <Button
                    className="icon"
                    onClick={handleEditSchedule}
                    key={`${i}-edit`}
                  >
                    <FontAwesomeIcon icon={faPencil} size="xs" />
                  </Button>
                  <Button
                    className="icon"
                    onClick={handleRemoveSchedule}
                    key={`${i}-delete`}
                  >
                    <FontAwesomeIcon icon={faCircleXmark} size="xs" />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="shared-schedules">
            <p className="content-title">Shared with me</p>
            {sharedSchedules.map((friend) => {
              return (
                <div className="friend">
                  <p>{friend.name}</p>
                  {friend.schedules.map((schedule, i) => {
                    return (
                      <div className="checkbox-container">
                        <div className="checkbox" />
                        {/* style={selected ? {background-color: {versionBgColor}} : {}} */}
                        <p>{schedule.name}</p>
                        <Button
                          className="icon"
                          onClick={handleEditSchedule}
                          key={`${i}-edit`}
                        >
                          <FontAwesomeIcon icon={faPencil} size="xs" />
                        </Button>
                        {friend.schedules.length >= 2 && (
                          <Button
                            className="icon"
                            onClick={handleRemoveSchedule}
                            key={`${i}-delete`}
                          >
                            <FontAwesomeIcon icon={faCircleXmark} size="xs" />
                          </Button>
                        )}
                      </div>
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
        </div>
      </div>
    </div>
  );
}
