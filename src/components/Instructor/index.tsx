import React, { useCallback, useContext, useId } from 'react';
import {
  faAngleDown,
  faAngleUp,
  faBan,
  faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';

import { classes, simplifyName, unique } from '../../utils/misc';
import { Section as SectionBean } from '../../data/beans';
import { ActionRow, Prerequisite, Section } from '..';
import { ScheduleContext } from '../../contexts';
import usePrereqControl from '../../hooks/usePrereqControl';

import './stylesheet.scss';

export type InstructorProps = {
  className?: string;
  color: string | undefined;
  name: string;
  sections: SectionBean[];
  gpa: string;
  prereqDepth: number;
};

export default function Instructor({
  className,
  color,
  name,
  sections,
  gpa,
  prereqDepth,
}: InstructorProps): React.ReactElement {
  const [{ pinnedCrns, excludedCrns }, { patchSchedule }] =
    useContext(ScheduleContext);

  const { prereqAction, prereqControl, expanded, prereqOpen } =
    usePrereqControl(name);

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

  const areProfPrereqsSame = prereqDepth === 1;

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
            onClick: (): void => prereqControl(false, !expanded),
          },
          ...(areProfPrereqsSame ? [prereqAction] : []),
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
                prereqDepth={prereqDepth}
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
      {expanded && prereqOpen && areProfPrereqsSame && sections?.[0] && (
        <Prerequisite
          parent={sections[0]}
          prereqs={sections?.[0]?.prereqs ?? []}
        />
      )}
    </div>
  );
}
