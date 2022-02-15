import React, { useState } from 'react';

import './stylesheet.scss';

const exampleCourse = {
  title: 'CS 1100: Freshman Leap Seminar',
  description:
    'Small group discussions with first year students are led by one or more faculty members and include a variety of foundational, motivational, and topical subjects for computationalist.',
  creditHours: 3,
  prerequisites: ['CS 1331'],
  gpa: 3.06,
  gradeDistribution: { A: 45.6, B: 34.9, C: 21.2, D: 2.3, F: 1.1, W: 5.4 },
  professors: [
    {
      name: 'John Stasko',
      gpa: 3.16,
      gradeDistribution: { A: 45.6, B: 34.9, C: 21.2, D: 2.3, F: 1.1, W: 5.4 },
      sections: [
        {
          crn: '00000',
          sectionNumber: 'A01',
          days: 'MWF',
          time: '11:00am-11:50am',
          seatsFilled: '140/150',
          waitlist: '10/20',
          location: 'College of Business 100',
        },
        {
          crn: '00000',
          sectionNumber: 'A01',
          days: 'MWF',
          time: '11:00am-11:50am',
          seatsFilled: '140/150',
          waitlist: '10/20',
          location: 'College of Business 100',
        },
      ],
    },
    {
      name: 'Mary Hudachek-Buswell',
      gpa: 3.16,
      gradeDistribution: { A: 45.6, B: 34.9, C: 21.2, D: 2.3, F: 1.1, W: 5.4 },
      sections: [
        {
          crn: '00000',
          sectionNumber: 'A01',
          days: 'MWF',
          time: '11:00am-11:50am',
          seatsFilled: '140/150',
          waitlist: '10/20',
          location: 'College of Business 100',
        },
        {
          crn: '00000',
          sectionNumber: 'A01',
          days: 'MWF',
          time: '11:00am-11:50am',
          seatsFilled: '140/150',
          waitlist: '10/20',
          location: 'College of Business 100',
        },
      ],
    },
  ],
};

type SectionType = {
  crn: string;
  sectionNumber: string;
  days: string;
  time: string;
  seatsFilled: string;
  waitlist: string;
  location: string;
};

const Section = ({
  section: { crn, sectionNumber, days, time, seatsFilled, waitlist, location },
}: {
  section: SectionType;
}): JSX.Element => {
  const [selected, setSelected] = useState(false);

  return (
    <tr className="section-info">
      <td>
        <button
          className="selection-button"
          type="button"
          onClick={(): void => {
            setSelected(!selected);
          }}
        >
          {selected ? (
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.04989 12.4483C4.68014 12.4483 4.32994 12.2758 4.10554 11.9783L1.06849 7.96543C0.974597 7.8415 0.906046 7.70028 0.866761 7.54985C0.827475 7.39941 0.818225 7.2427 0.839539 7.08869C0.860853 6.93467 0.912314 6.78637 0.990979 6.65226C1.06964 6.51814 1.17397 6.40085 1.29799 6.30708C1.42197 6.21292 1.56332 6.14415 1.71392 6.10472C1.86453 6.06529 2.02144 6.05596 2.17565 6.07728C2.32987 6.0986 2.47836 6.15015 2.61262 6.22896C2.74688 6.30778 2.86426 6.41231 2.95804 6.53658L4.95639 9.17498L9.98075 1.10678C10.1474 0.840388 10.4129 0.650963 10.719 0.580053C11.0251 0.509144 11.3468 0.56254 11.6136 0.728528C12.1686 1.07363 12.3395 1.80463 11.9927 2.36053L6.05629 11.889C5.95496 12.0524 5.81528 12.1886 5.64938 12.2858C5.48348 12.3829 5.29637 12.4382 5.10429 12.4466C5.08559 12.4483 5.06859 12.4483 5.04989 12.4483Z"
                fill="#8BD6FB"
              />
            </svg>
          ) : (
            <svg
              width="12"
              height="13"
              viewBox="0 0 12 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.9999 6.49995C11.9999 7.0806 11.9519 7.54995 11.3989 7.54995H6.99988V12.1689C6.99988 12.7485 6.55288 12.8 5.99988 12.8C5.44688 12.8 4.99988 12.7485 4.99988 12.1689V7.54995H0.600878C0.0488778 7.54995 -0.00012207 7.0806 -0.00012207 6.49995C-0.00012207 5.9193 0.0488778 5.44995 0.600878 5.44995H4.99988V0.831001C4.99988 0.250351 5.44688 0.199951 5.99988 0.199951C6.55288 0.199951 6.99988 0.250351 6.99988 0.831001V5.44995H11.3989C11.9519 5.44995 11.9999 5.9193 11.9999 6.49995Z"
                fill="#8BD6FB"
              />
            </svg>
          )}
        </button>
      </td>
      <td>{crn}</td>
      <td>{sectionNumber}</td>
      <td>{days}</td>
      <td>{time}</td>
      <td>{seatsFilled}</td>
      <td>{waitlist}</td>
      <td>{location}</td>
    </tr>
  );
};

export default function SearchResultContainer(): React.ReactElement {
  const [selectedCourse, setSelectedCourse] = useState(exampleCourse);

  const generatePrereqString = (prereqs: string[]): string => {
    let prereqString = '';
    prereqs.forEach((course) => {
      prereqString = `${prereqString} ${course}`;
    });

    return prereqString;
  };

  return (
    <div className="SearchResultContainer">
      {selectedCourse ? (
        <div className="selected-course">
          <h2>{selectedCourse.title}</h2>
          <p>{selectedCourse.description}</p>
          <table className="info-table">
            <tr>
              <th className="header-title">Credit Hours</th>
              <td>{selectedCourse.creditHours}</td>
            </tr>
            <tr>
              <th className="header-title">Prerequisites</th>
              <td>{generatePrereqString(selectedCourse.prerequisites)}</td>
            </tr>
            <tr>
              <th className="header-title">Course GPA</th>
              <td>{selectedCourse.gpa}</td>
            </tr>
            <tr>
              <th className="header-title">Grade Distr.</th>
              <td className="info-table-grade-distribution">
                {Object.keys(selectedCourse.gradeDistribution).map((grade) => {
                  return (
                    <>
                      <p className="letter">{`${grade}`}</p>
                      <p className="grade">
                        {`${
                          selectedCourse.gradeDistribution[
                            grade as keyof typeof selectedCourse.gradeDistribution
                          ]
                        }%`}
                      </p>
                    </>
                  );
                })}
              </td>
            </tr>
          </table>
          <table className="grade-distribution" cellSpacing={0}>
            <tr className="grade-distribution-header">
              <td />
              <td>CRN</td>
              <td>Sect.</td>
              <td>Day</td>
              <td>Time</td>
              <td>Seats Filled</td>
              <td>Waitlist</td>
              <td>Location</td>
            </tr>
            {selectedCourse.professors.map((professor) => {
              return (
                <>
                  <tr>
                    <td colSpan={8}>
                      <div className="professor-header">
                        <div className="professor-header-left">
                          <p className="name">{professor.name}</p>
                          <p className="gpa">{`GPA: ${professor.gpa}`}</p>
                        </div>
                        <div className="grade-distribution-string">
                          {Object.keys(professor.gradeDistribution).map(
                            (grade) => {
                              return (
                                <>
                                  <p className="letter">{`${grade}`}</p>
                                  <p className="grade">
                                    {`${
                                      professor.gradeDistribution[
                                        grade as keyof typeof professor.gradeDistribution
                                      ]
                                    }%`}
                                  </p>
                                </>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <>
                    {professor.sections.map((section: SectionType) => {
                      return <Section section={section} />;
                    })}
                  </>
                </>
              );
            })}
          </table>
        </div>
      ) : (
        <div className="default-icon">
          <div>
            <img
              src="/courseSearchResultDefault.png"
              alt="Course Search Result Default Icon"
              style={{ width: '120px', margin: '0 auto' }}
            />
          </div>
          <h3>Course Details</h3>
          <p>Look up a course and browse the details here!</p>
        </div>
      )}
    </div>
  );
}
