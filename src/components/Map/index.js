import React, { useContext, useState, useEffect } from 'react';
import MapView from '../MapView';
import { periodToString } from '../../utils';
import { TermContext } from '../../contexts';
import { DaySelection } from '../DaySelection/index';

const Map = () => {
  const [{ oscar, pinnedCrns }] = useContext(TermContext);
  const [activeDay, setActiveDay] = useState('');
  const [activeLocations, setActiveLocations] = useState([]);
  const locations = [];
  const courseDateMap = {
    M: [],
    T: [],
    W: [],
    R: [],
    F: []
  };

  useEffect(() => {
    if (activeDay !== '') {
      setActiveLocations(
        locations.filter((loc) =>
          courseDateMap[activeDay].some((course) => course.id === loc.id)
        )
      );
    } else {
      setActiveLocations([]);
    }
  }, [activeDay]);

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

    // todo: pull lat-long from oscar data
    const location = {
      lat:
        Math.random() < 0.5
          ? 33.7756 + Math.random() / 250
          : 33.7756 - Math.random() / 250,
      lng:
        Math.random() < 0.5
          ? -84.396 + Math.random() / 250
          : -84.396 - Math.random() / 250
    };

    locations.push({
      id: info.course.id,
      title: info.course.title,
      days: meetings.days,
      time: periodToString(meetings.period),
      lat: location.lat,
      lng: location.lng
    });
  });

  return (
    <div className="map-content" style={{ display: 'flex', height: '100vh' }}>
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
