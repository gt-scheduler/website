import React, { useContext } from 'react';
import ago from 's-ago';
import { Button, Course, CatalogCourseAdd, CourseAdd } from '..';
import 'react-virtualized/styles.css';
import './stylesheet.scss';
import { TermContext } from '../../contexts';

export function CourseContainer(props) {
  const [{ oscar, desiredCourses, catalogCourses }] = useContext(TermContext);

  return (
    <div className="CourseContainer">
      <div className="scroller">
        <div className="course-list">
          { props.isCatalog
            ?
            catalogCourses.map((courseId) => {
            return <Course courseId={courseId} expandable key={courseId} isExpandable={props.isExpandable}/>;
            })
            :
            desiredCourses.map((courseId) => {
            return <Course courseId={courseId} expandable key={courseId} isExpandable={props.isExpandable}/>;
            })
          }
        </div>
        
        { props.isCatalog
          ?
          <CatalogCourseAdd className="catalog-course-add" />
          :
          <CourseAdd className="course-add" />
        }
        
      </div>
      <Button
        className="updated-at"
        href="https://github.com/gtbitsofgood/gt-schedule-crawler"
      >
        Course data fetched {ago(oscar.updatedAt)}
      </Button>
    </div>
  );
}
