import React, { useContext } from 'react';

import { AppNavigationContext, SchedulerPageType } from '../App/navigation';
import { ScheduleContext } from '../../contexts';
import CardContainer from '../Card';
import CourseInfo from '../CourseInfo';
import { getRandomColor } from '../../utils/misc';

import './stylesheet.scss';

export default function CourseDetails(): React.ReactElement {
  const [{ desiredCourses, colorMap, palette }] = useContext(ScheduleContext);
  const { setCurrentSchedulerPage } = useContext(AppNavigationContext);

  if (desiredCourses.length === 0) {
    return (
      <div className="empty-container">
        <div className="empty-course-details">
          <img src="empty_course_details.svg" alt="Empty Course Details" />
          <span className="empty-title">Course Details</span>
          <span className="empty-description">Add courses to view details</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cards-container">
      {desiredCourses.map((courseId) => {
        return (
          <CardContainer
            color={colorMap[courseId] || getRandomColor(palette)}
            key={courseId}
          >
            <div className="card-content">
              <CourseInfo courseId={courseId} />
              <div
                className="view-section"
                onClick={(): void =>
                  setCurrentSchedulerPage({
                    type: SchedulerPageType.SECTION_DETAILS,
                    courseId,
                  })
                }
              >
                <img
                  alt="view section info"
                  src="info.svg"
                  className="section-info-svg"
                />
                View section details
              </div>
            </div>
          </CardContainer>
        );
      })}
    </div>
  );
}
