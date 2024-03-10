import React, { useCallback, useContext, useId, useState } from 'react';
import {
  faAngleDown,
  faAngleUp,
  faBan,
  faGraduationCap,
  faShareAlt,
} from '@fortawesome/free-solid-svg-icons';

import { classes, simplifyName, unique } from '../../utils/misc';
import { Section as SectionBean } from '../../data/beans';
import { ActionRow, Prerequisite, Section } from '..';
import { ScheduleContext } from '../../contexts';

import './stylesheet.scss';

export type InstructorProps = {
  className?: string;
  color: string | undefined;
  name: string;
  sections: SectionBean[];
  gpa: string;
  areSectionPrereqsDiff: boolean;
};

export default function Instructor({
  className,
  color,
  name,
  sections,
  gpa,
  areSectionPrereqsDiff,
}: InstructorProps): React.ReactElement {
  const [{ pinnedCrns, excludedCrns }, { patchSchedule }] =
    useContext(ScheduleContext);
  const [expanded, setExpanded] = useState(true);
  const [prereqOpen, setPrereqOpen] = useState<boolean>(false);

  const prereqControl = (
    nextPrereqOpen: boolean,
    nextExpanded: boolean
  ): void => {
    setPrereqOpen(nextPrereqOpen);
    setExpanded(nextExpanded);
  };
  const prereqAction = {
    icon: faShareAlt,
    styling: { transform: 'rotate(90deg)' },
    onClick: (): void => {
      prereqControl(true, !prereqOpen ? true : !expanded);
    },
    tooltip: 'View Prerequisites',
    id: `${name}-prerequisites`,
  };

  const includeSection = useCallback(
    (section: SectionBean) => {
      patchSchedule({
        excludedCrns: excludedCrns.filter((crn) => crn !== section.crn),
      });
    },
    [excludedCrns, patchSchedule]
  );

  const excludeSections = useCallback(
    (sectionList: SectionBean[]) => {
      const crns = sectionList.map((section) => section.crn);
      patchSchedule({
        excludedCrns: unique([...excludedCrns, ...crns]),
        pinnedCrns: pinnedCrns.filter((crn) => !crns.includes(crn)),
      });
    },
    [excludedCrns, pinnedCrns, patchSchedule]
  );

  const instructorPinned = sections.some((section) =>
    pinnedCrns.includes(section.crn)
  );

  const includedSections = sections.filter(
    (section) => !excludedCrns.includes(section.crn)
  );
  const excludedSections = sections.filter((section) =>
    excludedCrns.includes(section.crn)
  );

  const excludeTooltipId = useId();
  return (
    <div
      className={classes(
        'Instructor',
        !expanded && 'divider-bottom',
        className
      )}
    >
      <ActionRow
        label={name || 'Not Assigned'}
        actions={[
          {
            icon: expanded ? faAngleUp : faAngleDown,
            onClick: (): void => setExpanded(!expanded),
          },
          ...(areSectionPrereqsDiff ? [prereqAction] : []),
          !['TBA', 'Not Assigned'].includes(name)
            ? {
                icon: faGraduationCap,
                tooltip: 'View Instructor Ratings',
                href: `http://www.ratemyprofessors.com/search/professors/361?q=${encodeURIComponent(
                  simplifyName(name)
                )}`,
                id: `${simplifyName(name, '-').toLowerCase()}-rmp`,
              }
            : null,
          {
            icon: faBan,
            id: excludeTooltipId,
            tooltip: 'Exclude from Combinations',
            onClick: (): void => excludeSections(sections),
          },
        ]}
        style={instructorPinned ? { backgroundColor: color } : undefined}
      >
        <div className="instructor-row">
          <span className="gpa">Instructor GPA: {gpa || 'N/A'}</span>
        </div>
      </ActionRow>
      {expanded && !prereqOpen && (
        <div className={classes('section-container', 'nested')}>
          {includedSections.map((section) => {
            const pinned = pinnedCrns.includes(section.crn);
            return (
              <Section
                key={section.id}
                className="divider-bottom"
                section={section}
                color={color}
                pinned={pinned}
              />
            );
          })}
          {excludedSections.length > 0 && (
            <div className="excluded-section-container">
              {excludedSections.map((section) => (
                <span
                  className="excluded-section"
                  key={section.id}
                  onClick={(): void => includeSection(section)}
                >
                  {section.id}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {expanded && prereqOpen && areSectionPrereqsDiff && sections?.[0] && (
        <Prerequisite
          parent={sections[0]}
          prereqs={sections?.[0]?.prereqs ?? []}
        />
      )}
    </div>
  );
}
