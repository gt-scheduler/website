import React, { useContext, useState } from 'react';

import MapView, { MapLocation } from '../MapView';
import { ScheduleContext } from '../../contexts';
import DaySelection, { CourseDateItem, Day, isDay } from '../DaySelection';
import { Meeting, Event, Location } from '../../types';

import './stylesheet.scss';

// Construct combined course data
// to pass to `<MapView>` and `<DaySelection>`
type CombinedCourseData = CourseDateItem & {
  coords: Location | null;
  section?: string;
  isEvent?: boolean;
};

export default function Map(): React.ReactElement {
  const [{ oscar, pinnedCrns, events }] = useContext(ScheduleContext);
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

  // Add events to the course data and track unpictured events
  const unpicturedEvents: Event[] = [];

  events.forEach((event) => {
    // Check if event has location data - be more defensive about type checking
    const eventWithLocation = event as Event & {
      where?: string;
      location?: Location | null;
    };
    const eventWhere = eventWithLocation.where;
    const eventLocation = eventWithLocation.location;

    // Check if event has valid location data for map display
    const hasValidLocation =
      typeof eventWhere === 'string' &&
      eventLocation &&
      typeof eventLocation.lat === 'number' &&
      typeof eventLocation.long === 'number';

    event.days.forEach((day) => {
      if (!isDay(day)) return;
      const courses = courseDateMap[day] ?? [];

      if (hasValidLocation) {
        // Add event with location to map and sidebar
        const courseData: CombinedCourseData = {
          id: event.id,
          title: event.name,
          times: event.period,
          daysOfWeek: [...event.days],
          coords: eventLocation,
          isEvent: true,
        };
        courses.push(courseData);
      } else {
        // Add event without location to sidebar only
        const courseData: CombinedCourseData = {
          id: event.id,
          title: event.name,
          times: event.period,
          daysOfWeek: [...event.days],
          coords: null,
          isEvent: true,
        };
        courses.push(courseData);

        // Track unpictured events (avoid duplicates)
        if (!unpicturedEvents.some((e) => e.id === event.id)) {
          unpicturedEvents.push({
            ...event,
            days: [...event.days],
          });
        }
      }

      courseDateMap[day] = courses;
    });
  }); // Sort each list of course data by their times
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
    // Only include items with valid coordinates for the map view
    activeLocations = sortedCourseDateMap[activeDay]
      .filter(
        (item): item is CombinedCourseData & { coords: Location } =>
          item.coords !== null
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        section: item.section,
        coords: item.coords,
        isEvent: item.isEvent,
      }));
  }

  return (
    <div className="map-content">
      <DaySelection
        courseDateMap={sortedCourseDateMap}
        unpicturedEvents={unpicturedEvents}
        activeDay={activeDay}
        setActiveDay={setActiveDay}
      />
      <MapView locations={activeLocations} />
    </div>
  );
}
