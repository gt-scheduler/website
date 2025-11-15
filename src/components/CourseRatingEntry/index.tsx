import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Section from '../../data/beans/Section';
import DropdownInput from '../DropdownInput';
import './stylesheet.scss';

type CourseRatingEntryProps = {
  section?: Section;
  unselectedSections: Section[];
  editable?: boolean;
  onDelete?: () => void;
  onComplete?: (section: Section) => void;
};

export default function CourseRatingEntry({
  section,
  unselectedSections,
  editable = false,
  onDelete,
  onComplete,
}: CourseRatingEntryProps): React.ReactElement {
  const course = section?.course;
  const instructors = section?.instructors ?? [];
  const subject = course?.subject ?? '';
  const number = course?.number ?? '';
  const title = course?.title ?? '';
  const baseSections = course?.sections ?? [];

  const [courseSelected, setCourseSelected] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [sectionOptions, setSectionOptions] = useState(
    baseSections.map((s) => ({
      id: s.crn,
      shortLabel: s.id,
      longLabel: (
        <div>
          <div className="label-code">{s.id}</div>
          <div className="label-title">
            {s.instructors.length ? s.instructors.join(', ') : 'N/A'}
          </div>
        </div>
      ),
    }))
  );

  const rawCourseOptions = [
    ...(subject && number && title
      ? [
          {
            id: `${subject} ${number} ${title}`,
            shortLabel: `${subject} ${number} ${title}`,
            longLabel: (
              <div>
                <div className="label-code">{`${subject} ${number}`}</div>
                <div className="label-title">{title}</div>
              </div>
            ),
          },
        ]
      : []),
    ...unselectedSections.map((sec) => ({
      id: `${sec.course.subject} ${sec.course.number} ${sec.course.title}`,
      shortLabel: `${sec.course.subject} ${sec.course.number} ${sec.course.title}`,
      longLabel: (
        <div>
          <div className="label-code">{`${sec.course.subject} ${sec.course.number}`}</div>
          <div className="label-title">{sec.course.title}</div>
        </div>
      ),
    })),
  ];

  const courseOptions = rawCourseOptions.filter(
    (opt, index, self) =>
      self.findIndex((o) => o.shortLabel === opt.shortLabel) === index
  );

  const handleCourseSelect = (courseLabel: string): void => {
    setSelectedCourse(courseLabel);
    setCourseSelected(true);

    const match =
      unselectedSections.find(
        (s) =>
          `${s.course.subject} ${s.course.number} ${s.course.title}` ===
          courseLabel
      ) ?? section;

    const sectionsForCourse = match?.course?.sections ?? [];

    setSectionOptions(
      sectionsForCourse.map((s) => ({
        id: s.crn,
        shortLabel: s.id,
        longLabel: (
          <div>
            <div className="label-code">{s.id}</div>
            <div className="label-title">
              {s.instructors.length ? s.instructors.join(', ') : 'N/A'}
            </div>
          </div>
        ),
      }))
    );
  };

  const handleSectionSelect = (crn: string): void => {
    setSelectedSection(crn);

    if (!onComplete) return;

    const allSections = [...(section ? [section] : []), ...unselectedSections];
    const found = allSections.find((s) => s.crn === crn);
    if (found) onComplete(found);
  };

  return (
    <div className="course-rating-entry">
      <button
        type="button"
        className="delete-button"
        onClick={onDelete}
        aria-label="Delete course"
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>

      {editable ? (
        <>
          {!courseSelected ? (
            <div className="info-row">
              <div className="label">Course:</div>
              <div className="course-dropdown">
                <DropdownInput
                  searchable
                  options={courseOptions}
                  value={selectedCourse}
                  onChange={handleCourseSelect}
                  placeholder="Choose"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="info-row">
                <div className="label">Course:</div>
                <div className="value">
                  {selectedCourse ||
                    (subject && number ? `${subject} ${number} ${title}` : '—')}
                </div>
              </div>
              <div className="info-row">
                <div className="label">Section:</div>
                <div className="section-dropdown">
                  <DropdownInput
                    options={sectionOptions}
                    value={selectedSection}
                    onChange={handleSectionSelect}
                    placeholder="Choose"
                  />
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="info-row">
            <div className="label">Course:</div>
            <div className="value">
              {subject && number ? `${subject} ${number} ${title}` : '—'}
            </div>
          </div>

          <div className="info-row">
            <div className="label">Section:</div>
            <div className="value section">{section?.id}</div>
            <div className="label instructor">Instructor:</div>
            <div className="value">
              {instructors.length ? instructors.join(', ') : 'TBA'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
