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
import {
  fetchCourseCritique,
  removeCourse,
} from '../../beans/fetchCourseCritique';
import DistBarGraph from './DistBarGraph/index.jsx';

class Course extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      infoExpanded: false,
      paletteShown: false,
      critiqueData: 'Loading...',
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
    removeCourse(this.props.courseId);
  }

  handleToggleExpanded(expanded = !this.state.expanded) {
    this.setState({
      expanded: expanded,
      infoExpanded: false,
    });
  }

  handleSelectColor(color) {
    const { courseId } = this.props;
    const { colorMap } = this.props.user;
    this.props.setColorMap({ ...colorMap, [courseId]: color });
  }

  handleTogglePaletteShown(paletteShown = !this.state.paletteShown) {
    this.setState({ paletteShown });
  }
  handleInfoExpanded(infoExpanded = !this.state.infoExpanded) {
    if (this.state.critiqueData.avgGpa) {
      this.setState({
        infoExpanded: infoExpanded,
        expanded: false,
      });
    }
  }

  componentDidMount() {
    if (this.props.fromClass === 'course-list') {
      fetchCourseCritique(this.props.courseId).then((critiqueData) => {
        this.setState({
          critiqueData,
        });
      });
    }
  }

  showGpaDistGraph() {
    const { pinnedCrns } = this.props.user;
    const { oscar } = this.props.db;
    const courseCrns = pinnedCrns.filter(
      (crn) => oscar.findSection(crn).course.id === this.props.courseId
    );
    if (
      this.state.critiqueData instanceof Object &&
      this.state.critiqueData.avgGpa
    ) {
      let matchProfCritiques = courseCrns.map((crn) => {
        let oscarProfName = oscar.findSection(crn).instructors[0].split(' ');
        oscarProfName = oscarProfName[oscarProfName.length - 1];
        let profValues = this.state.critiqueData.instructors.filter((item) => {
          let lastName = item.profName.split(',')[0].toLowerCase();
          return lastName === oscarProfName.toLowerCase();
        })[0];
        try {
          return profValues;
        } catch (err) {
          return null;
        }
      });

      matchProfCritiques = matchProfCritiques.filter((item) => item !== null);

      return matchProfCritiques;
    }

    return [];
  }

  showProfessorGpa() {
    const { pinnedCrns } = this.props.user;
    const { oscar } = this.props.db;
    const courseCrns = pinnedCrns.filter(
      (crn) => oscar.findSection(crn).course.id === this.props.courseId
    );
    let matchProfCritiques = courseCrns.map((crn) => {
      let oscarProfName = oscar.findSection(crn).instructors[0].split(' ');
      oscarProfName = oscarProfName[oscarProfName.length - 1].toLowerCase();
      let profValues = this.state.critiqueData.instructors.filter((item) => {
        let lastName = item.profName.split(',')[0].toLowerCase();
        return lastName === oscarProfName;
      })[0];
      try {
        return {
          instructor: oscar.findSection(crn).instructors[0],
          gpa: profValues.avgGpa,
        };
      } catch (err) {
        return null;
      }
    });

    matchProfCritiques = matchProfCritiques.filter((item) => item !== null);

    matchProfCritiques = Array.from(
      new Set(matchProfCritiques.map((a) => a.instructor))
    ).map((instructor) => {
      return matchProfCritiques.find((a) => a.instructor === instructor);
    });

    matchProfCritiques = matchProfCritiques.map((item) => {
      return (
        <div className="avgGpa" key={item.instructor}>
          <div className="labelAverage course">{item.instructor}:</div>
          <div className="gpa course" style={this.props.colorFn(item.gpa)}>
            {item.gpa}
          </div>
        </div>
      );
    });

    return matchProfCritiques;
  }

  render() {
    const {
      className,
      courseId,
      onAddCourse,
      onSetOverlayCrns,
      colorFn,
    } = this.props;
    const { oscar } = this.props.db;
    const { term, pinnedCrns, colorMap } = this.props.user;
    const { expanded, paletteShown, infoExpanded, critiqueData } = this.state;

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
                  {
                    icon: faInfoCircle,
                    onClick: () => this.handleInfoExpanded(),
                  },

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
            <span className="course_id" style={{ fontWeight: 750 }}>
              {course.id} <br />
              {this.props.fromClass === 'course-list' ? (
                <div
                  style={{
                    display: 'inline-block',
                  }}
                >
                  {critiqueData.avgGpa ? (
                    <>
                      <div className="avgGpa">
                        <div className="labelAverage course">Average GPA:</div>
                        <div
                          className="gpa course"
                          style={colorFn(critiqueData.avgGpa)}
                        >
                          {critiqueData.avgGpa}
                        </div>
                      </div>
                      {this.showProfessorGpa()}
                    </>
                  ) : (
                    <div className="avgGpa">
                      <div className="labelAverage course">
                        {critiqueData === 'Loading...'
                          ? 'Loading...'
                          : 'Stats Not Available'}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div></div>
              )}
            </span>

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
              style={{ fontWeight: 700, fontStyle: 'italic' }}
              dangerouslySetInnerHTML={{ __html: course.title }}
            />
            <span className="section_crns">
              {course.sections
                .filter((section) => pinnedCrns.includes(section.crn))
                .map((section) => section.crn)
                .join(', ')}
            </span>
            {paletteShown && (
              <Palette
                className="palette"
                onSelectColor={this.handleSelectColor}
                color={color}
                onMouseLeave={() => this.handleTogglePaletteShown(false)}
              />
            )}
          </div>
        </ActionRow>

        {this.props.fromClass === 'course-list' &&
        critiqueData.avgGpa &&
        infoExpanded ? (
          <div className="course-info">
            <div>
              <DistBarGraph
                data={this.showGpaDistGraph()}
                avg={{
                  a: critiqueData.a,
                  b: critiqueData.b,
                  c: critiqueData.c,
                  d: critiqueData.d,
                  f: critiqueData.f,
                  w: 0,
                }}
                avgColor={color}
              />
            </div>
          </div>
        ) : null}

        {critiqueData && expanded && (
          <div className="course-body">
            {Object.keys(instructorMap).map((name) => (
              <Instructor
                key={name}
                color={color}
                name={name}
                sections={instructorMap[name]}
                onSetOverlayCrns={onSetOverlayCrns}
                instructorData={this.state.critiqueData.instructors}
                colorFn={colorFn}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default connect(({ db, user }) => ({ db, user }), actions)(Course);
