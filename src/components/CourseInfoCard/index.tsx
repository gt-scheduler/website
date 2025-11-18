import React, { useContext, useEffect, useState } from 'react';

import CardContainer from '../CardContainer';
import CourseInfo from '../CourseInfo';
import { ScheduleContext } from '../../contexts';
import { getRandomColor } from '../../utils/misc';

import './stylesheet.scss';
import { AppNavigationContext } from '../App/navigation';
import { set } from 'lodash';

export type CourseInfoCardProps = {
  courseId: string;
};

export default function CourseInfoCard({
  courseId,
}: CourseInfoCardProps): React.ReactElement | null {
  const [{ colorMap, palette }] = useContext(ScheduleContext);
  const [color, setColor] = useState<string>(getRandomColor(palette));
  const [{ oscar }] = useContext(ScheduleContext);
  const fullCourse = oscar.findCourse(courseId);
  const { currentSchedulerPage, setCurrentSchedulerPage } =
    useContext(AppNavigationContext);

  useEffect(() => {
    const courseColor = colorMap?.[courseId];
    if (courseColor) {
      setColor(courseColor);
    }
  }, [courseId, colorMap]);

  const handleClick = (): void => {
    if (fullCourse) {
      setCurrentSchedulerPage({ type: 'section-details', course: fullCourse });
    }
  };

  return (
    <CardContainer color={color}>
      <CourseInfo courseId={courseId} infoType="short" />
      <div className="view-section" onClick={handleClick}>
        <img
          alt="view section info"
          src="/section_info.svg"
          className="section-info-svg"
        />
        View section details
      </div>
    </CardContainer>
  );
}
