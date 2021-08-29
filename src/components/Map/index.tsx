import React, { useContext, useState } from 'react';

import MapView, { MapLocation } from '../MapView';
import { periodToString } from '../../utils';
import { TermContext } from '../../contexts';
import DaySelection, { CourseDateItem, Day, isDay } from '../DaySelection';
import { Meeting } from '../../types';

import './stylesheet.scss';

export default function Map(): React.ReactElement {
  const [{ oscar, pinnedCrns }] = useContext(TermContext);
  const [activeDay, setActiveDay] = useState<Day | ''>('M');
  const locations: MapLocation[] = [];
  const courseDateMap: Record<Day, CourseDateItem[]> = {
    M: [],
    T: [],
    W: [],
    R: [],
    F: [],
  };

  // Construct the courseDateMap and locations data structures
  pinnedCrns.forEach((crn) => {
    const section = oscar.findSection(crn);
    if (section == null) return;
    const { meetings } = section;
    if (meetings.length === 0) return;
    const firstMeeting = meetings[0] as Meeting;

    firstMeeting.days.forEach((day) => {
      if (!isDay(day)) return;
      const courses = courseDateMap[day] ?? [];
      courses.push({
        id: section.course.id,
        title: section.course.title,
        times: firstMeeting.period,
        daysOfWeek: firstMeeting.days,
      });
      courseDateMap[day] = courses;
    });

    locations.push({
      section: section.id,
      id: section.course.id,
      title: section.course.title,
      days: firstMeeting.days,
      time: periodToString(firstMeeting.period),
      coords: firstMeeting.location,
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
