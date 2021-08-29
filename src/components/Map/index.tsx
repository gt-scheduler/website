import React, { useContext, useState } from 'react';

import MapView, { MapLocation } from '../MapView';
import { periodToString } from '../../utils';
import { TermContext } from '../../contexts';
import DaySelection, { CourseDateItem, Day, isDay } from '../DaySelection';
import { SafeRecord } from '../../types';

import './stylesheet.scss';

export default function Map(): React.ReactElement {
  const [{ oscar, pinnedCrns }] = useContext(TermContext);
  const [activeDay, setActiveDay] = useState<Day | ''>('M');
  const locations: MapLocation[] = [];
  const courseDateMap: SafeRecord<Day, CourseDateItem[]> = {
    M: [],
    T: [],
    W: [],
    R: [],
    F: []
  };

  // Construct the courseDateMap and locations data structures
  pinnedCrns.forEach((crn) => {
    const section = oscar.findSection(crn);
    if (section == null) return;

    const meetings = section.meetings[0];
    meetings.days.forEach((day) => {
      if (!isDay(day)) return;
      const courses = courseDateMap[day] ?? [];
      courses.push({
        id: section.course.id,
        title: section.course.title,
        times: meetings.period,
        daysOfWeek: meetings.days
      });
      courseDateMap[day] = courses;
    });

    locations.push({
      section: section.id,
      id: section.course.id,
      title: section.course.title,
      days: meetings.days,
      time: periodToString(meetings.period),
      coords: meetings.location
    });
  });

  let activeLocations: MapLocation[] = [];
  if (activeDay !== '') {
    activeLocations = locations.filter((loc) =>
      (courseDateMap[activeDay] ?? []).some((course) => course.id === loc.id)
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
}
