import React from 'react';

import './stylesheet.scss';

interface GradeObj {
  letter: string;
  percentage: number;
}

type CourseCatalogHeaderProps = {
  currentCourse: string;
  description: string;
  creditHours: number;
  prerequisite: string;
  courseGPA: Array<GradeObj>;
};

type LetterGradeProps = {
  name: string;
  percentage: number;
};

const CourseCatalogHeader = ({
  currentCourse,
  description,
  creditHours,
  prerequisite,
  courseGPA
}: CourseCatalogHeaderProps) => {
  const prereqArr = prerequisite.split('and');

  /**
   * @returns The formatted prerequiste child component
   */
  const PrereqArrComp = () => (
    <>
      {prereqArr.length === 1 ? (
        <div>
          {prerequisite}
          <br />
        </div>
      ) : (
        prereqArr.map((prereqSegment, index) => (
          <div key={prereqSegment}>
            {prereqSegment}
            {index === prereqArr.length - 1 ? null : (
              <span className="bold">and</span>
            )}
            <br />
          </div>
        ))
      )}
    </>
  );

  /**
   * @returns The formatted letter grade display
   */
  const LetterGradeComp = ({ name, percentage }: LetterGradeProps) => (
    <div className="container__col-1">
      <span className="letter">{name}&nbsp;&nbsp;</span>
      <span>{percentage}%</span>
    </div>
  );

  return (
    <>
      <div className="container">
        <div className="container__row">
          <div className="container__col-12 courseName">{currentCourse}</div>
        </div>
        <div className="container__row">
          <div className="container__col-12 courseDescription">
            {description}
          </div>
        </div>
        <div key={2} className="container__row">
          <div className="container__col-1 courseAttr">Credit Hours</div>
          <div className="container__col-3">{creditHours}</div>
        </div>
        <div className="container__row">
          <div className="container__col-1 courseAttr">Prerequisites</div>
          <div className="container__col-8">
            <PrereqArrComp />
          </div>
        </div>
        <div className="container__row">
          <div className="container__col-1 courseAttr">Course GPA</div>
          {courseGPA.map((gradeObj) => (
            <LetterGradeComp
              key={gradeObj.letter.toString()}
              name={gradeObj.letter}
              percentage={gradeObj.percentage}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default CourseCatalogHeader;
