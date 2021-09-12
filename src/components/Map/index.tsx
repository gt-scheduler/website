import React, { useContext, useState } from 'react';

import MapView, { MapLocation } from '../MapView';
import { ScheduleContext } from '../../contexts';
import DaySelection, { CourseDateItem, Day, isDay } from '../DaySelection';
import { Meeting } from '../../types';

import './stylesheet.scss';

// Construct combined course data
// to pass to `<MapView>` and `<DaySelection>`
type CombinedCourseData = CourseDateItem & MapLocation;

export default function Map(): React.ReactElement {
  const [{ oscar, pinnedCrns }] = useContext(ScheduleContext);
  const [activeDay, setActiveDay] = useState<Day | ''>('M');
  const courseDateMap: Record<Day, CombinedCourseData[]> = {
    M: [],
    T: [],
    W: [],
    R: [],
    F: [],
  };

  // Construct the course data for the first meeting of each class
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
        section: section.id,
        coords: firstMeeting.location,
      });
      courseDateMap[day] = courses;
    });
  });

  // Sort each list of course data by their times
  const sortedCourseDateMap: Record<Day, CombinedCourseData[]> = {
    M: [],
    T: [],
    W: [],
    R: [],
    F: [],
  };
  Object.entries(courseDateMap).forEach(([day, courseDataList]) => {
    if (!isDay(day)) return;
    sortedCourseDateMap[day] = courseDataList.sort(
      (a, b) => (a.times?.start ?? 0) - (b.times?.start ?? 0)
    );
  });

  let activeLocations: MapLocation[] = [];
  if (activeDay !== '') {
    activeLocations = sortedCourseDateMap[activeDay];
  }

  return (
    <div className="map-content">
      <DaySelection
        courseDateMap={sortedCourseDateMap}
        activeDay={activeDay}
        setActiveDay={setActiveDay}
      />
      <MapView locations={activeLocations} />
    </div>
  );
}
