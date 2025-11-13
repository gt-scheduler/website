import React, { useContext, useState } from 'react';

import MapView, { MapLocation } from '../MapView';
import { ScheduleContext } from '../../contexts';
import DaySelection, { CourseDateItem, Day, isDay } from '../DaySelection';
import { Meeting } from '../../types';
import {
  MULTIPLE_TOPICS_COURSE_TITLE,
  getSectionCourseTitle,
} from '../../utils/misc';

import './stylesheet.scss';

// Construct combined course data
// to pass to `<MapView>` and `<DaySelection>`
type CombinedCourseData = CourseDateItem & MapLocation;

export default function Map(): React.ReactElement {
  const [{ oscar, pinnedCrns }] = useContext(ScheduleContext);
  const [activeDay, setActiveDay] = useState<Day | ''>('ALL');
  const courseDateMap: Record<Day, CombinedCourseData[]> = {
    ALL: [],
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
      const courseItem: CombinedCourseData = {
        id: section.course.id,
        title: getSectionCourseTitle(section),
        times: firstMeeting.period,
        daysOfWeek: firstMeeting.days,
        section: section.id,
        coords: firstMeeting.location,
      };
      courseDateMap[day].push(courseItem);
    });
  });

  // Sort each list of course data by their times
  const sortedCourseDateMap: Record<Day, CombinedCourseData[]> = {
    ALL: [],
    M: [],
    T: [],
    W: [],
    R: [],
    F: [],
  };
  const seenCourseKeys = new Set<string>();
  Object.entries(courseDateMap).forEach(([day, courseDataList]) => {
    if (!isDay(day) || day === 'ALL') return;
    sortedCourseDateMap[day] = courseDataList.sort(
      (a, b) => (a.times?.start ?? 0) - (b.times?.start ?? 0)
    );
    sortedCourseDateMap[day].forEach((course) => {
      // `course` is the lightweight map entry
      // `courseBean` is the full Oscar course record
      const courseBean = oscar.findCourse(course.id);
      const sectionBean = courseBean?.sections.find(
        (section) => section.id === course.section
      );
      // Normal courses dedupe by course ID; multi-topic courses dedupe by
      // course ID plus their unique section title.
      const dedupeKey =
        sectionBean?.course.title === MULTIPLE_TOPICS_COURSE_TITLE
          ? `${course.id}:${sectionBean?.sectionTitle ?? course.section}`
          : course.id;
      if (seenCourseKeys.has(dedupeKey)) return;
      seenCourseKeys.add(dedupeKey);
      sortedCourseDateMap.ALL.push({ ...course });
    });
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
