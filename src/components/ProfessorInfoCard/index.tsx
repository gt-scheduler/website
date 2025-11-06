import React, { useContext } from 'react';
import { faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import useSWR from 'swr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ScheduleContext } from '../../contexts';
import { Course, Section } from '../../data/beans';
import ActionRow from '../ActionRow';
import { formatTime, getRandomColor } from '../../utils/misc';
import { Schedule } from '../../data/types';
import { OccupiedInfo } from '../../data/beans/Section';

import './stylesheet.scss';

export type ProfessorInfoCardProps = {
  professorName: string;
  course: Course;
};

type SeatData = {
  inClass: OccupiedInfo | null;
  waitlist: OccupiedInfo | null;
};

function SectionRow({
  section,
  term,
  isPinned,
  onAdd,
}: {
  section: Section;
  term: string;
  isPinned: boolean;
  onAdd: () => void;
}): React.ReactElement {
  const meeting = section.meetings[0];

  const { data: seatData, isLoading } = useSWR<SeatData>(
    ['seating', section.crn, term],
    () => section.getSeatData(term)
  );

  const formatSeatData = (info: OccupiedInfo | null): string => {
    if (isLoading) return 'Loading...';
    if (!info) return 'N/A';
    return `${info.occupied} / ${info.total}`;
  };

  return (
    <ActionRow key={section.crn} className="section-row" label="" actions={[]}>
      <div className="section-content">
        <div className="left-group">
          <div className="row-cell action-cell">
            <button
              type="button"
              className="action-button"
              onClick={(): void => (isPinned ? undefined : onAdd())}
            >
              <FontAwesomeIcon
                icon={isPinned ? faCheck : faPlus}
                className="action-icon"
              />
            </button>
          </div>

          <div className="row-cell">{section.crn}</div>
          <div className="row-cell">{section.id}</div>
          <div className="row-cell">{meeting?.days.join('') || 'TBA'}</div>
          <div className="row-cell">
            {meeting?.period
              ? `${formatTime(meeting.period.start)}-${formatTime(
                  meeting.period.end
                )}`
              : 'TBA'}
          </div>
        </div>
        <div className="right-group">
          <div className="row-cell">
            {formatSeatData(seatData?.inClass ?? null)}
          </div>
          <div className="row-cell">
            {formatSeatData(seatData?.waitlist ?? null)}
          </div>
          <div className="row-cell">{meeting?.where || 'TBA'}</div>
        </div>
      </div>
    </ActionRow>
  );
}

export default function ProfessorInfoCard({
  professorName,
  course,
}: ProfessorInfoCardProps): React.ReactElement {
  const sections: Section[] = course.sections.filter((section: Section) => {
    return section.instructors[0] === professorName;
  });
  const [{ pinnedCrns, desiredCourses, colorMap, palette }, { patchSchedule }] =
    useContext(ScheduleContext);

  const handleAddSection = (section: Section): void => {
    const updates: Partial<Schedule> = {
      pinnedCrns: [...pinnedCrns, section.crn],
    };
    if (!desiredCourses.includes(course.id)) {
      updates.desiredCourses = [...desiredCourses, course.id];
      const color = getRandomColor(palette);
      updates.colorMap = { ...colorMap, [course.id]: color };
    }
    patchSchedule(updates);
  };

  return (
    <div className="ProfessorInfo">
      <div className="professor-header">
        <p className="professor-name">{professorName}</p>
      </div>

      <div className="sections-container">
        <div className="sections-header">
          <div className="left-group">
            <div className="row-cell" />
            <div className="row-cell">CRN</div>
            <div className="row-cell">Sect.</div>
            <div className="row-cell">Day</div>
            <div className="row-cell">Time</div>
          </div>
          <div className="right-group">
            <div className="row-cell">Seats Filled</div>
            <div className="row-cell">Waitlist</div>
            <div className="row-cell">Location</div>
          </div>
        </div>

        {sections.map((section) => {
          return (
            <SectionRow
              key={section.crn}
              section={section}
              term={course.term}
              isPinned={pinnedCrns.includes(section.crn)}
              onAdd={(): void => handleAddSection(section)}
            />
          );
        })}
      </div>
    </div>
  );
}
