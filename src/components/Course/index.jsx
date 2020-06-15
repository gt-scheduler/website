import React from 'react';
import { connect } from 'react-redux';
import {
  faAngleDown,
  faAngleUp,
  faInfoCircle,
  faPalette,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { classes, getContentClassName } from '../../utils';
import { actions } from '../../reducers';
import { ActionRow, Instructor, Palette, SemiPureComponent } from '../';
import './stylesheet.scss';

class Course extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      paletteShown: false,
    };

    this.handleSelectColor = this.handleSelectColor.bind(this);
  }

  handleRemoveCourse(course) {
    const {
      desiredCourses,
      pinnedCrns,
      excludedCrns,
      colorMap,
    } = this.props.user;
    this.props.setDesiredCourses(
      desiredCourses.filter((courseId) => courseId !== course.id)
    );
    this.props.setPinnedCrns(
      pinnedCrns.filter(
        (crn) => !course.sections.some((section) => section.crn === crn)
      )
    );
    this.props.setExcludedCrns(
      excludedCrns.filter(
        (crn) => !course.sections.some((section) => section.crn === crn)
      )
    );
    this.props.setColorMap({ ...colorMap, [course.id]: undefined });
  }

  handleToggleExpanded(expanded = !this.state.expanded) {
    this.setState({ expanded });
  }

  handleSelectColor(color) {
    const { courseId } = this.props;
    const { colorMap } = this.props.user;
    this.props.setColorMap({ ...colorMap, [courseId]: color });
  }

  handleTogglePaletteShown(paletteShown = !this.state.paletteShown) {
    this.setState({ paletteShown });
  }

  render() {
    const { className, courseId, onAddCourse, onSetOverlayCrns } = this.props;
    const { oscar } = this.props.db;
    const { term, pinnedCrns, colorMap } = this.props.user;
    const { expanded, paletteShown } = this.state;

    const course = oscar.findCourse(courseId);
    const color = colorMap[course.id];
    const textClassName = getContentClassName(color);

    const instructorMap = {};
    course.sections.forEach((section) => {
      const [primaryInstructor = 'Not Assigned'] = section.instructors;
      if (!(primaryInstructor in instructorMap)) {
        instructorMap[primaryInstructor] = [];
      }
      instructorMap[primaryInstructor].push(section);
    });

    const infoAction = {
      icon: faInfoCircle,
      href: `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_course_detail?cat_term_in=${term}&subj_code_in=${course.subject}&crse_numb_in=${course.number}`,
    };

    return (
      <div
        className={classes('Course', textClassName, 'default', className)}
        style={{ backgroundColor: color }}
        key={course.id}
      >
        <ActionRow
          className={classes('course-header', expanded && 'divider-bottom')}
          actions={
            onAddCourse
              ? [{ icon: faPlus, onClick: onAddCourse }, infoAction]
              : [
                  {
                    icon: expanded ? faAngleUp : faAngleDown,
                    onClick: () => this.handleToggleExpanded(),
                  },
                  infoAction,
                  {
                    icon: faPalette,
                    onClick: () => this.handleTogglePaletteShown(),
                  },
                  {
                    icon: faTrash,
                    onClick: () => this.handleRemoveCourse(course),
                  },
                ]
          }
          color={color}
        >
          <div className="row">
            <span className="course_id">{course.id}</span>
            <span className="section_ids">
              {course.sections
                .filter((section) => pinnedCrns.includes(section.crn))
                .map((section) => section.id)
                .join(', ')}
            </span>
          </div>
          <div className="row">
            <span
              className="course_title"
              dangerouslySetInnerHTML={{ __html: course.title }}
            />
            <span className="section_crns">
              {course.sections
                .filter((section) => pinnedCrns.includes(section.crn))
                .map((section) => section.crn)
                .join(', ')}
            </span>
          </div>
          {paletteShown && (
            <Palette
              className="palette"
              onSelectColor={this.handleSelectColor}
              color={color}
              onMouseLeave={() => this.handleTogglePaletteShown(false)}
            />
          )}
        </ActionRow>
        {expanded && (
          <div className="course-body">
            {Object.keys(instructorMap).map((name) => (
              <Instructor
                key={name}
                color={color}
                name={name}
                sections={instructorMap[name]}
                onSetOverlayCrns={onSetOverlayCrns}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default connect(({ db, user }) => ({ db, user }), actions)(Course);
