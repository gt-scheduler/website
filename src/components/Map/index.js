import React, { useContext, useState } from 'react';
import MapView from '../MapView';
import { periodToString } from '../../utils';
import { ScheduleContext } from '../../contexts';
import DaySelection from '../DaySelection';

import './stylesheet.scss';

const Map = () => {
  const [{ oscar, pinnedCrns }] = useContext(ScheduleContext);
  const [activeDay, setActiveDay] = useState('M');
  const locations = [];
  const courseDateMap = {
    M: [],
    T: [],
    W: [],
    R: [],
    F: []
  };

  // Construct the courseDateMap and locations data structures
  pinnedCrns.forEach((crn) => {
    const info = oscar.crnMap[crn.toString()];
    const meetings = info.meetings[0];

    meetings.days.forEach((day) => {
      courseDateMap[day].push({
        id: info.course.id,
        title: info.course.title,
        times: meetings.period,
        daysOfWeek: meetings.days
      });
    });

    locations.push({
      section: info.id,
      id: info.course.id,
      title: info.course.title,
      days: meetings.days,
      time: periodToString(meetings.period),
      coords: meetings.location
    });
  });

  let activeLocations = [];
  if (activeDay !== '') {
    activeLocations = locations.filter((loc) =>
      courseDateMap[activeDay].some((course) => course.id === loc.id)
    );
  }

  return (
    <div className="map-content">
      <DaySelection
        courseDateMap={courseDateMap}
        activeDay={activeDay}
        setActiveDay={setActiveDay}
      />
      <MapView locations={activeLocations} />
    </div>
  );
};

export default Map;
