import React, { useContext } from 'react';
import MapView from '../MapView';
import { periodToString } from '../../utils';
import { TermContext } from '../../contexts';

const Map = () => {
  const [{ oscar, pinnedCrns }] = useContext(TermContext);
  const locations = [];

  pinnedCrns.forEach(crn => {
    const info = oscar.crnMap[crn.toString()];
    const meetings = info.meetings[0];

    locations.push({
      id: info.course.id,
      title: info.course.title,
      days: meetings.days,
      time: periodToString(meetings.period),
      coords: meetings.location
    });
  });

  return <MapView locations={locations} />;
};

export default Map;
