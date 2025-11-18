import React, { useContext, useEffect, useState } from 'react';

import CardContainer from '../CardContainer';
import CourseInfo from '../CourseInfo';
import { ScheduleContext } from '../../contexts';
import { getRandomColor } from '../../utils/misc';

import './stylesheet.scss';

export type CourseInfoCardProps = {
  courseId: string;
};

export default function CourseInfoCard({
  courseId,
}: CourseInfoCardProps): React.ReactElement | null {
  const [{ colorMap, palette }] = useContext(ScheduleContext);
  const [color, setColor] = useState<string>(getRandomColor(palette));

  useEffect(() => {
    const courseColor = colorMap?.[courseId];
    if (courseColor) {
      setColor(courseColor);
    }
  }, [courseId, colorMap]);

  return (
    <CardContainer color={color}>
      <CourseInfo courseId={courseId} infoType="short" />
      <div className="view-section">
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
