import React, { useContext, useState } from 'react';
import { ScheduleContext } from '../../contexts/schedule';

export default function RatingsPage(): React.ReactElement {
  const [{ pinnedCrns, desiredCourses, oscar }] = useContext(ScheduleContext);
  const [courses, setCourses] = useState();

  console.log(pinnedCrns, oscar);

  return (
    <div
      style={{
        width: '100%',
        height: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}
    >
      hello
    </div>
  );
}
