import React, { useCallback, useContext, useState } from 'react';
import {
  faAngleDown,
  faAngleUp,
  faBan,
  faGraduationCap
} from '@fortawesome/free-solid-svg-icons';
import { classes, simplifyName, unique } from '../../utils';
import { ActionRow, Section } from '..';
import './stylesheet.scss';
import { ScheduleContext } from '../../contexts';

export default function Instructor({ className, color, name, sections, gpa }) {
  const [{ pinnedCrns, excludedCrns }, { patchScheduleData }] = useContext(
    ScheduleContext
  );
  const [expanded, setExpanded] = useState(true);

  const includeSection = useCallback(
    (section) => {
      patchScheduleData({
        excludedCrns: excludedCrns.filter((crn) => crn !== section.crn)
      });
    },
    [excludedCrns, patchScheduleData]
  );

  const excludeSections = useCallback(
    (sectionList) => {
      const crns = sectionList.map((section) => section.crn);
      patchScheduleData({
        excludedCrns: unique([...excludedCrns, ...crns]),
        pinnedCrns: pinnedCrns.filter((crn) => !crns.includes(crn))
      });
    },
    [excludedCrns, pinnedCrns, patchScheduleData]
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
            onClick: () => setExpanded(!expanded)
          },
          !['TBA', 'Not Assigned'].includes(name) && {
            icon: faGraduationCap,
            href: `http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=Georgia+Institute+of+Technology&query=${encodeURIComponent(
              simplifyName(name)
            )}`
          },
          {
            icon: faBan,
            title: 'Exclude from Combinations',
            onClick: () => excludeSections(sections)
          }
        ]}
        style={instructorPinned ? { backgroundColor: color } : undefined}
      >
        <div className="instructor-row">
          <span className="gpa">Instructor GPA: {gpa || 'N/A'}</span>
        </div>
      </ActionRow>
      {expanded && (
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
                  onClick={() => includeSection(section)}
                >
                  {section.id}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
