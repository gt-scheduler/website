import React, { useState } from 'react';
import Section from '../../data/beans/Section';
import CourseRatingEntry from '../CourseRatingEntry';
import './stylesheet.scss';

type CourseRatingCardProps = {
  selectedSections: Section[];
  unselectedSections: Section[];
  onAddCourse: (section: Section) => void;
  onDeleteCourse: (crn: string) => void; // 🔹 new callback
};

export default function CourseRatingCard({
  selectedSections,
  unselectedSections,
  onAddCourse,
  onDeleteCourse,
}: CourseRatingCardProps): React.ReactElement {
  const [editableEntries, setEditableEntries] = useState<number[]>([]);

  const handleAddEditable = (): void => {
    setEditableEntries((prev) => [...prev, Date.now()]);
  };

  const handleCompleteEditable = (key: number, section: Section): void => {
    onAddCourse(section);
    handleDeleteEditable(key);
  };

  const handleDeleteEditable = (key: number): void => {
    setEditableEntries((prev) => prev.filter((k) => k !== key));
  };

  const handleDelete = (crn: string): void => {
    onDeleteCourse(crn);
  };

  return (
    <div className="course-rating-card">
      <div className="card-header">
        To start,
        <br />
        Are these the courses you took for Spring 2024?
      </div>

      <div className="entries-scroll">
        {selectedSections.map((section) => (
          <CourseRatingEntry
            key={section.crn}
            section={section}
            unselectedSections={unselectedSections}
            editable={false}
            onDelete={(): void => handleDelete(section.crn)}
          />
        ))}

        {editableEntries.map((key) => (
          <CourseRatingEntry
            key={key}
            unselectedSections={unselectedSections}
            editable
            onComplete={(section): void => handleCompleteEditable(key, section)}
            onDelete={(): void => handleDeleteEditable(key)}
          />
        ))}
      </div>

      <button type="button" className="add-course" onClick={handleAddEditable}>
        + Add a course
      </button>
    </div>
  );
}
