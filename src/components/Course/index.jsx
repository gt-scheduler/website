import React from 'react';
import { connect } from 'react-redux';
import { faAngleDown, faAngleUp, faInfoCircle, faPalette, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
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
      gpaMap: {},
    };

    this.handleSelectColor = this.handleSelectColor.bind(this);
  }

  componentDidMount() {
    const { courseId, onAddCourse } = this.props;
    const { oscar } = this.props.db;
    if (!onAddCourse) {
      const course = oscar.findCourse(courseId);
      course.fetchGpa().then(gpaMap => this.setState({ gpaMap }));
    }
  }

  handleRemoveCourse(course) {
    const { desiredCourses, pinnedCrns, excludedCrns, colorMap } = this.props.user;
    this.props.setDesiredCourses(desiredCourses.filter(courseId => courseId !== course.id));
    this.props.setPinnedCrns(pinnedCrns.filter(crn => !course.sections.some(section => section.crn === crn)));
    this.props.setExcludedCrns(excludedCrns.filter(crn => !course.sections.some(section => section.crn === crn)));
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

  handleIncludeSections(sections) {
    const { excludedCrns } = this.props.user;
    const crns = sections.map(section => section.crn);
    this.props.setExcludedCrns(excludedCrns.filter(crn => !crns.includes(crn)));
  }

  render() {
    const { className, courseId, onAddCourse } = this.props;
    const { oscar } = this.props.db;
    const { term, pinnedCrns, excludedCrns, colorMap } = this.props.user;
    const { expanded, paletteShown, gpaMap } = this.state;

    const course = oscar.findCourse(courseId);
    const color = colorMap[course.id];
    const contentClassName = color && getContentClassName(color);

    const instructorMap = {};
    course.sections.forEach(section => {
      const [primaryInstructor = 'Not Assigned'] = section.instructors;
      if (!(primaryInstructor in instructorMap)) {
        instructorMap[primaryInstructor] = [];
      }
      instructorMap[primaryInstructor].push(section);
    });

    const instructors = Object.keys(instructorMap);
    const excludedInstructors = instructors.filter(instructor => {
      const sections = instructorMap[instructor];
      return sections.every(section => excludedCrns.includes(section.crn));
    });
    const includedInstructors = instructors.filter(instructor => !excludedInstructors.includes(instructor));

    const infoAction = {
      icon: faInfoCircle,
      href: `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_course_detail?cat_term_in=${term}&subj_code_in=${course.subject}&crse_numb_in=${course.number}`,
    };

    const pinnedSections = course.sections.filter(section => pinnedCrns.includes(section.crn));
    const totalCredits = pinnedSections.reduce((credits, section) => credits + section.credits, 0);

    return (
      <div className={classes('Course', contentClassName, 'default', className)}
           style={{ backgroundColor: color }}
           key={course.id}>
        <ActionRow label={[course.id, pinnedSections.map(section => section.id).join(', ')].join(' ')}
                   actions={onAddCourse ? [
                     { icon: faPlus, onClick: onAddCourse },
                     infoAction,
                   ] : [
                     { icon: expanded ? faAngleUp : faAngleDown, onClick: () => this.handleToggleExpanded() },
                     infoAction,
                     { icon: faPalette, onClick: () => this.handleTogglePaletteShown() },
                     { icon: faTrash, onClick: () => this.handleRemoveCourse(course) },
                   ]}>
          <div className="course-row">
            <span className="course-title" dangerouslySetInnerHTML={{ __html: course.title }}/>
            <span className="section-crns">
              {pinnedSections.map(section => section.crn).join(', ')}
            </span>
          </div>
          {
            !onAddCourse && (
              <div className="course-row">
                <span className="gpa">
                  Course GPA: {gpaMap.averageGpa || 'N/A'}
                </span>
                {
                  totalCredits > 0 && (
                    <span className="credits">
                      {totalCredits} Credits
                    </span>
                  )
                }
              </div>
            )
          }
          {
            paletteShown &&
            <Palette className="palette" onSelectColor={this.handleSelectColor} color={color}
                     onMouseLeave={() => this.handleTogglePaletteShown(false)}/>
          }
        </ActionRow>
        {
          expanded &&
          <div className={classes('instructor-container', 'nested')}>
            {
              includedInstructors.map(name => (
                <Instructor key={name} color={color} name={name}
                            sections={instructorMap[name]} gpa={gpaMap[name]}/>
              ))
            }
            {
              excludedInstructors.length > 0 &&
              <div className="excluded-instructor-container">
                {
                  excludedInstructors.map(name => (
                    <span className="excluded-instructor" key={name}
                          onClick={() => this.handleIncludeSections(instructorMap[name])}>
                      {name}
                    </span>
                  ))
                }
              </div>
            }
          </div>
        }
      </div>
    );
  }
}

export default connect(({ db, user }) => ({ db, user }), actions)(Course);
