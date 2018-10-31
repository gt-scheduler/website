import React from 'react';
import { connect } from 'react-redux';
import { faAngleDown, faAngleUp, faInfoCircle, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { classes } from '../../utils';
import { actions } from '../../reducers';
import { ActionRow, Instructor, SemiPureComponent } from '../';
import './stylesheet.scss';

class Course extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
    };
  }

  handleRemoveCourse(course) {
    const { desiredCourses, pinnedCrns, excludedCrns } = this.props.user;
    this.props.setDesiredCourses(desiredCourses.filter(courseId => courseId !== course.id));
    this.props.setPinnedCrns(pinnedCrns.filter(crn => !course.sections.some(section => section.crn === crn)));
    this.props.setExcludedCrns(excludedCrns.filter(crn => !course.sections.some(section => section.crn === crn)));
  }

  handleToggleExpanded(expanded = !this.state.expanded) {
    this.setState({ expanded });
  }

  render() {
    const { className, courseId, onAddCourse, onSetOverlayCrns } = this.props;
    const { oscar } = this.props.db;
    const { pinnedCrns } = this.props.user;
    const { expanded } = this.state;

    const course = oscar.findCourse(courseId);

    const instructorMap = {};
    course.sections.forEach(section => {
      const [primaryInstructor = 'Not Assigned'] = section.instructors;
      if (!(primaryInstructor in instructorMap)) {
        instructorMap[primaryInstructor] = [];
      }
      instructorMap[primaryInstructor].push(section);
    });

    return (
      <div className={classes('Course', className)} style={{ backgroundColor: course.color }} key={course.id}>
        <ActionRow className="course-header" actions={[
          onAddCourse ?
            { icon: faPlus, onClick: onAddCourse } :
            { icon: expanded ? faAngleUp : faAngleDown, onClick: () => this.handleToggleExpanded() },
          {
            icon: faInfoCircle,
            href: `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_course_detail?cat_term_in=201902&subj_code_in=${course.subject}&crse_numb_in=${course.number}`,
          },
          !onAddCourse && { icon: faTrash, onClick: () => this.handleRemoveCourse(course) },
        ]} color={course.color}>
          <div className="row">
            <span className="course_id">{course.id}</span>
            <span className="section_ids">
              {course.sections.filter(section => pinnedCrns.includes(section.crn)).map(section => section.id).join(', ')}
            </span>
          </div>
          <div className="row">
            <span className="course_title" dangerouslySetInnerHTML={{ __html: course.title }}/>
            <span className="section_crns">
              {course.sections.filter(section => pinnedCrns.includes(section.crn)).map(section => section.crn).join(', ')}
            </span>
          </div>
        </ActionRow>
        {
          expanded &&
          <div className="course-body">
            {
              Object.keys(instructorMap).map(name => (
                <Instructor key={name} course={course} name={name} sections={instructorMap[name]}
                            onSetOverlayCrns={onSetOverlayCrns}/>
              ))
            }
          </div>
        }
      </div>
    );
  }
}


export default connect(({ db, user }) => ({ db, user }), actions)(Course);
