import React, { useContext, useState } from 'react';

import MapView, { MapLocation } from '../MapView';
import { ScheduleContext } from '../../contexts';
import DaySelection, {
  ScheduleBlockDateItem,
  ScheduleBlockEventType,
  Day,
  isDay,
} from '../DaySelection';
import { Meeting, Event, Location } from '../../types';

import './stylesheet.scss';

// Construct combined course data
// to pass to `<MapView>` and `<DaySelection>`
type CombinedCourseData = ScheduleBlockDateItem & {
  coords: Location | null;
};

// Utility function to check if an event has valid location data for map display
function hasValidLocationData(
  where: unknown,
  location: unknown
): location is Location {
  return (
    typeof where === 'string' &&
    location !== null &&
    typeof location === 'object' &&
    'lat' in location &&
    'long' in location &&
    typeof location.lat === 'number' &&
    typeof location.long === 'number'
  );
}

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

  // Track unpictured events (sections/events without location)
  const unpicturedEvents: Event[] = [];

  // Construct the course data for the first meeting of each class
  pinnedCrns.forEach((crn) => {
    const section = oscar.findSection(crn);
    if (section == null) return;
    const { meetings } = section;
    if (meetings.length === 0) return;
    const firstMeeting = meetings[0] as Meeting;

    // Check if section has no location - add to unpictured events
    if (!firstMeeting.location && firstMeeting.period) {
      const virtualEvent: Event = {
        id: `virtual-${section.course.id}-${section.id}`,
        name: `${section.course.id} ${section.id}`,
        days: [...firstMeeting.days],
        period: firstMeeting.period,
      };
      unpicturedEvents.push(virtualEvent);
    }

    firstMeeting.days.forEach((day) => {
      if (!isDay(day)) return;
      const scheduleBlocks = courseDateMap[day] ?? [];
      scheduleBlocks.push({
        id: section.course.id,
        title: section.course.title,
        times: firstMeeting.period,
        daysOfWeek: firstMeeting.days,
        section: section.id,
        type: ScheduleBlockEventType.Course,
        coords: firstMeeting.location,
      });
      courseDateMap[day] = scheduleBlocks;
    });
  });

  events.forEach((event) => {
    // Check if event has location data - be more defensive about type checking
    const eventWithLocation = event as Event & {
      where?: string;
      location?: Location | null;
    };
    const eventWhere = eventWithLocation.where;
    const eventLocation = eventWithLocation.location;

    // Check if event has valid location data for map display
    const hasValidLocation = hasValidLocationData(eventWhere, eventLocation);

    event.days.forEach((day) => {
      if (!isDay(day)) return;
      const scheduleBlocks = courseDateMap[day] ?? [];

      if (hasValidLocation) {
        // Add event with location to map and sidebar
        const courseData: CombinedCourseData = {
          id: event.id,
          title: event.name,
          times: event.period,
          daysOfWeek: [...event.days],
          type: ScheduleBlockEventType.CustomEvent,
          coords: eventLocation,
          where: eventWhere,
        };
        scheduleBlocks.push(courseData);
      } else {
        // Add event without location to sidebar only
        const courseData: CombinedCourseData = {
          id: event.id,
          title: event.name,
          times: event.period,
          daysOfWeek: [...event.days],
          type: ScheduleBlockEventType.CustomEvent,
          coords: null,
          where: eventWhere,
        };
        scheduleBlocks.push(courseData);

        // Track unpictured events (avoid duplicates)
        if (!unpicturedEvents.some((e) => e.id === event.id)) {
          unpicturedEvents.push({
            ...event,
            days: [...event.days],
          });
        }
      }

      courseDateMap[day] = scheduleBlocks;
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
        type: item.type,
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
