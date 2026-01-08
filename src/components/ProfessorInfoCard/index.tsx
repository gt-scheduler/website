import React, { useContext, useEffect, useMemo, useState } from 'react';
import { faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ErrorWithFields, softError } from '../../log';
import { Course, Section } from '../../data/beans';
import { ScheduleContext } from '../../contexts';
import { Schedule } from '../../data/types';
import {
  normalizeSeatingData,
  getRandomColor,
  periodToString,
} from '../../utils/misc';
import ActionRow from '../ActionRow';
import MetricsCard, { Metric } from '../MetricsCard';
import useScrollFade from '../../hooks/useScrollFade';
import { OccupiedInfo } from '../../types';

import './stylesheet.scss';

export type ProfessorInfoCardProps = {
  professorName: string;
  professorMetrics: Metric[];
  course: Course;
  displaySectionInfo: boolean;
};

function SectionRow({
  section,
  term,
  isPinned,
  onAdd,
  onRemove,
}: {
  section: Section;
  term: string;
  isPinned: boolean;
  onAdd: () => void;
  onRemove: () => void;
}): React.ReactElement {
  const meeting = section.meetings[0];

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (section) {
      section
        .fetchSeating(term)
        .then(() => {
          setIsLoaded(true);
        })
        .catch((err) => {
          softError(
            new ErrorWithFields({
              message: 'error fetching section seating',
              source: err,
              fields: {
                crn: section.crn,
                term,
              },
            })
          );
        });
    }
  }, [section, term]);

  const seating = useMemo(() => {
    if (!isLoaded) {
      return { inClass: null, waitlist: null };
    }
    return normalizeSeatingData(section.seating);
  }, [isLoaded, section?.seating]);

  const formatSeatData = (info: OccupiedInfo | null): string => {
    if (!info) return 'N/A';
    return `${info.occupied} / ${info.total}`;
  };

  if (!section) {
    return <div />;
  }

  return (
    <ActionRow key={section.crn} className="section-row" label="" actions={[]}>
      <div className="section-content">
        <div className="row-cell action-cell">
          <button
            type="button"
            className="action-button"
            onClick={(): void => (isPinned ? onRemove() : onAdd())}
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
        <div className="row-cell">{periodToString(meeting?.period)}</div>

        <div className="row-cell">
          {formatSeatData(seating?.inClass ?? null)}
        </div>
        <div className="row-cell">
          {formatSeatData(seating?.waitlist ?? null)}
        </div>
        <div className="row-cell">{meeting?.where || 'TBA'}</div>
      </div>
    </ActionRow>
  );
}

export default function ProfessorInfoCard({
  professorName,
  professorMetrics,
  course,
  displaySectionInfo,
}: ProfessorInfoCardProps): React.ReactElement {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { fadeLeft, fadeRight } = useScrollFade(scrollRef, displaySectionInfo);

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

  const handleRemoveSection = (section: Section): void => {
    patchSchedule({
      pinnedCrns: pinnedCrns.filter((crn) => crn !== section.crn),
    });
  };

  return (
    <div className="ProfessorInfo">
      <div className="professor-header">
        <p className="professor-name">{professorName}</p>
      </div>

      <MetricsCard metrics={professorMetrics} />

      {displaySectionInfo && (
        <div className="sections-wrapper">
          {fadeLeft && <div className="fade-left" />}
          <div className="sections-container" ref={scrollRef}>
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
                  onRemove={(): void => handleRemoveSection(section)}
                />
              );
            })}
          </div>
          {fadeRight && <div className="fade-right" />}
        </div>
      )}
    </div>
  );
}
