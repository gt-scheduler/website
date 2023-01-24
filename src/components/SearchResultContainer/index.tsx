/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// eslint-disable
import React, { useContext, useEffect, useState } from 'react';

import { Course as CourseBean, Section as SectionBean } from '../../data/beans';
import { CourseGpa } from '../../types';
import { periodToString } from '../../utils/misc';
import { Seating } from '../../data/beans/Section';
import { ErrorWithFields, softError } from '../../log';
import { ScheduleContext, ThemeContext } from '../../contexts';

import './stylesheet.scss';

type ProfessorType = {
  name: string;
  sections: SectionBean[];
  gpa: string;
};
interface CourseDetailsAPIResponse {
  header: [
    {
      course_name: string | null | unknown;
      credits: number | null | unknown;
      description: string | null | unknown;
      full_name: string | null | unknown;
    }
  ];
  raw: Array<{
    instructor_gt_username: string | unknown;
    instructor_name: string | unknown;
    link: string | unknown;
    class_size_group: string | unknown;
    GPA: number | unknown;
    A: number | unknown;
    B: number | unknown;
    C: number | unknown;
    D: number | unknown;
    F: number | unknown;
    W: number | unknown;
  }>;
}

const Professor = ({ name, sections, gpa }: ProfessorType): JSX.Element => {
  return (
    <>
      <tr>
        <td colSpan={8}>
          <div className="professor-header">
            <div className="professor-header-left">
              <p className="name">{name}</p>
              <p className="gpa">{`GPA: ${gpa}`}</p>
            </div>
            <div className="grade-distribution-string">
              {/* {Object.keys(professor.gradeDistribution).map((grade) => {
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
              })} */}
            </div>
          </div>
        </td>
      </tr>
      <>
        {sections.map((section: SectionBean) => {
          return <Section key={section.id} section={section} />;
        })}
      </>
    </>
  );
};

type SectionProps = {
  section: SectionBean;
};

const Section = ({ section }: SectionProps): JSX.Element => {
  const [{ term }] = useContext(ScheduleContext);
  const [selected, setSelected] = useState(false);
  const [seating, setSeating] = useState<Seating>([[], 0]);

  useEffect(() => {
    section
      .fetchSeating(term)
      .then((newSeating) => {
        setSeating(newSeating);
      })
      .catch((err) =>
        softError(
          new ErrorWithFields({
            message: 'error while fetching seating',
            source: err,
            fields: { crn: section.crn, term: section.term },
          })
        )
      );
  });

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
      <td>{section.crn}</td>
      <td>{section.id}</td>
      <td>{section.meetings[0]?.days.join('')}</td>
      <td>{periodToString(section.meetings[0]?.period)}</td>
      <td>
        {seating[0].length === 0
          ? `Loading...`
          : typeof seating[0][1] === 'number'
          ? // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `${seating[0][1] ?? '<unknown>'}/${seating[0][0] ?? '<unknown>'}`
          : `N/A`}
      </td>
      <td>
        {seating[0].length === 0
          ? `Loading...`
          : typeof seating[0][1] === 'number'
          ? // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `${seating[0][3] ?? '<unknown>'}/${seating[0][2] ?? '<unknown>'}`
          : `N/A`}
      </td>
      <td>{section.meetings[0]?.where}</td>
    </tr>
  );
};

export type SearchResultContainerProps = {
  // TODO: Fix props name to something more meaningful
  passedCourse?: CourseBean;
};

type CourseHeader = {
  course_name: string | null | unknown;
  credits: number | null | unknown;
  description: string | null | unknown;
  full_name: string | null | unknown;
};

export default function SearchResultContainer({
  // TODO: Fix props name to something more meaningful
  passedCourse,
}: SearchResultContainerProps): React.ReactElement | null {
  const [selectedCourse, setSelectedCourse] = useState<CourseBean>();
  const [selectedCourseGpa, setSelectedCourseGpa] = useState<string>();
  const [courseHeader, setCourseHeader] = useState<CourseHeader>({
    course_name: 'N/A',
    credits: 'N/A',
    description: 'N/A',
    full_name: 'N/A',
  });
  const [gpaMap, setGpaMap] = useState<CourseGpa | null>(null);

  const [theme] = useContext(ThemeContext);
  // TODO: Use for course info
  // const generatePrereqString = (prereqs: string[]): string => {
  //   let prereqString = '';
  //   prereqs.forEach((course) => {
  //     prereqString = `${prereqString} ${course}`;
  //   });

  //   return prereqString;
  // };

  useEffect(() => {
    setSelectedCourse(passedCourse);
  }, [passedCourse]);

  useEffect(() => {
    const fetchGpa = async (): Promise<void> => {
      if (selectedCourse) {
        const courseGpa = await selectedCourse.fetchGpa();
        setGpaMap(courseGpa);
        setSelectedCourseGpa(courseGpa.averageGpa?.toFixed(2));
        const details: CourseDetailsAPIResponse | null =
          await selectedCourse.fetchCourseDetailAPIResponse();
        if (details) {
          if (details.header.length > 0) {
            setCourseHeader(details.header[0]);
          } else {
            setCourseHeader({
              course_name: 'Course info not available',
              credits: 'Course info not available',
              description: 'Course info not available',
              full_name: 'Course info not available',
            });
          }
        }
      }
    };
    fetchGpa().catch((err) => {
      softError(
        new ErrorWithFields({
          message: 'error fetching course GPA',
          source: err,
          fields: {
            courseId: selectedCourse?.id,
            term: selectedCourse?.term,
          },
        })
      );
    });
  }, [selectedCourse]);

  if (selectedCourse === null) {
    return null;
  }

  const instructorMap: Record<string, SectionBean[] | undefined> = {};
  selectedCourse?.sections.forEach((section) => {
    const [primaryInstructor = 'Not Assigned'] = section.instructors;

    const instructorSections = instructorMap[primaryInstructor] ?? [];
    instructorSections.push(section);
    instructorMap[primaryInstructor] = instructorSections;
  });

  const imageLink =
    theme === 'light'
      ? '/courseSearchResultDefaultLight.png'
      : '/courseSearchResultDefault.png';
  const imageAlt =
    theme === 'light'
      ? 'Course Search Result Default Light'
      : 'Course Search Result Default';

  return (
    <div className="SearchResultContainer">
      {selectedCourse ? (
        <div className="selected-course">
          <h2>{selectedCourse.title}</h2>
          <p>{courseHeader.description as string}</p>
          <table className="info-table">
            <tr>
              <th className="header-title">Credit Hours</th>
              <td>{courseHeader.credits as string}</td>
            </tr>
            <tr>
              <th className="header-title">Prerequisites</th>
              {/* <td>{generatePrereqString()}</td> */}
              <td>Prerequisites go here</td>
            </tr>
            <tr>
              <th className="header-title">Course GPA</th>
              <td>{selectedCourseGpa}</td>
            </tr>
            <tr>
              <th className="header-title">Grade Distr.</th>
              <td className="info-table-grade-distribution">
                {/* {Object.keys(courseDetails.raw[0]).map((grade) => {
                  return (
                    <>
                      <p className="letter">{`${grade}`}</p>
                      <p className="grade">
                        {`${selectedCourse.gradeDistribution[grade as Grade]}%`}
                      </p>
                    </>
                  );
                })} */}
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
            {instructorMap ? (
              Object.keys(instructorMap).map((professor: string) => {
                let instructorGpa: number | undefined = 0;
                if (gpaMap !== null) {
                  instructorGpa = gpaMap[professor];
                }
                return (
                  <Professor
                    key={professor}
                    name={professor}
                    sections={instructorMap[professor] ?? []}
                    gpa={
                      gpaMap === null
                        ? 'Loading...'
                        : instructorGpa
                        ? instructorGpa.toFixed(2)
                        : 'N/A'
                    }
                  />
                );
              })
            ) : (
              <></>
            )}
          </table>
        </div>
      ) : (
        <div className="default-icon">
          <div>
            <img
              src={imageLink}
              alt={imageAlt}
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
