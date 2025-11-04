import React, { useContext } from 'react';
import { faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import useSWR from 'swr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ScheduleContext } from '../../contexts';
import { Course, Section } from '../../data/beans';
import ActionRow from '../ActionRow';
import { OccupiedInfo } from '../SeatInfo';

import './stylesheet.scss';

export type ProfessorInfoCardProps = {
  professorName: string;
  course: Course;
};

type SeatData = {
  inClass: OccupiedInfo | null;
  waitlist: OccupiedInfo | null;
};

const fetchSeating = async (
  section: Section,
  term: string
): Promise<SeatData> => {
  try {
    const raw = await section.fetchSeating(term);

    // Handle missing or bad data, assuming less than 4 return values is invalid
    if (!raw[0] || raw[0].length < 4) {
      return { inClass: null, waitlist: null };
    }

    const [inClassTotal, inClassOccupied, waitlistTotal, waitlistOccupied] =
      raw[0];

    const toOccupiedInfo = (
      total: unknown,
      occupied: unknown
    ): OccupiedInfo => ({
      occupied: Number(occupied ?? 0),
      total: Number(total ?? 0),
    });

    return {
      inClass: toOccupiedInfo(inClassTotal, inClassOccupied),
      waitlist: toOccupiedInfo(waitlistTotal, waitlistOccupied),
    };
  } catch (err) {
    return { inClass: null, waitlist: null };
  }
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
    () => fetchSeating(section, term)
  );

  const formatSeatData = (info: OccupiedInfo | null): string => {
    if (isLoading) return 'Loading...';
    if (!info) return 'N/A';
    return `${info.occupied} / ${info.total}`;
  };

  return (
    <ActionRow key={section.crn} className="section-row" label="" actions={[]}>
      <div className="section-content">
        <div className="section-cell action-cell">
          <button
            type="button"
            className="action-button"
            onClick={(): void => (isPinned ? undefined : onAdd())}
          >
            <FontAwesomeIcon
              icon={isPinned ? faCheck : faPlus}
              style={{
                color: '#8BD6FB',
              }}
            />
          </button>
        </div>

        <div className="section-cell">{section.crn}</div>
        <div className="section-cell">{section.id}</div>
        <div className="section-cell">{meeting?.days.join('') || 'TBA'}</div>
        <div className="section-cell">
          {meeting?.period
            ? `${formatTime(meeting.period.start)}-${formatTime(
                meeting.period.end
              )}`
            : 'TBA'}
        </div>
        <div className="section-cell">
          {formatSeatData(seatData?.inClass ?? null)}
        </div>
        <div className="section-cell">
          {formatSeatData(seatData?.waitlist ?? null)}
        </div>
        <div className="section-cell">{meeting?.where || 'TBA'}</div>
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
  const [{ pinnedCrns }, { patchSchedule }] = useContext(ScheduleContext);

  const handleAddSection = (section: Section): void => {
    patchSchedule({ pinnedCrns: [...pinnedCrns, section.crn] });
  };

  return (
    <div className="ProfessorInfo">
      <div className="professor-header">
        <h1 className="professor-name">{professorName}</h1>
      </div>

      <div className="sections-container">
        <div className="sections-header">
          <div className="header-cell" />
          <div className="header-cell">CRN</div>
          <div className="header-cell">Sect.</div>
          <div className="header-cell">Day</div>
          <div className="header-cell">Time</div>
          <div className="header-cell">Seats Filled</div>
          <div className="header-cell">Waitlist</div>
          <div className="header-cell">Location</div>
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

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}
