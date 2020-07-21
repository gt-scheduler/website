import React from 'react';
import { connect } from 'react-redux';
import { Course, SemiPureComponent } from '../';
import { classes, getRandomColor, refineInstructionalMethodAttribute } from '../../utils';
import { actions } from '../../reducers';
import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { INSTRUCTIONAL_METHOD_ATTRIBUTES } from '../../constants';

class CourseAdd extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.state = {
      courses: [],
      keyword: '',
      attributes: [],
      activeIndex: 0,
    };

    this.inputRef = React.createRef();

    this.handleChangeKeyword = this.handleChangeKeyword.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  handleChangeKeyword(e) {
    const { oscar } = this.props.db;
    const { desiredCourses } = this.props.user;
    const { attributes } = this.state;

    let keyword = e.target.value.trim();
    const results = keyword.match(/^([A-Z]+)(\d.*)$/i);
    if (results) {
      const [, subject, number] = results;
      keyword = `${subject} ${number}`;
    }
    const courses = oscar.searchCourses(keyword, attributes)
      .filter((course) => !desiredCourses.includes(course.id));
    this.setState({
      courses,
      keyword,
      activeIndex: 0,
    });
  }

  handleKeyDown(e) {
    const { courses, activeIndex } = this.state;

    switch (e.key) {
      case 'Enter':
        const activeCourse = courses[activeIndex];
        if (activeCourse) {
          this.handleAddCourse(activeCourse);
        }
        break;
      case 'ArrowDown':
        this.setState({
          activeIndex: Math.min(activeIndex + 1, courses.length - 1),
        });
        break;
      case 'ArrowUp':
        this.setState({
          activeIndex: Math.max(activeIndex - 1, 0),
        });
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  handleAddCourse(course) {
    const { desiredCourses, excludedCrns, colorMap } = this.props.user;
    if (desiredCourses.includes(course.id)) return;
    const tbaCrns = course.sections
      .filter(
        (section) =>
          !section.meetings.length ||
          section.meetings.some(
            (meeting) => !meeting.days.length || !meeting.period,
          ),
      )
      .map((section) => section.crn);
    this.props.setDesiredCourses([...desiredCourses, course.id]);
    this.props.setExcludedCrns([...excludedCrns, ...tbaCrns]);
    this.props.setColorMap({ ...colorMap, [course.id]: getRandomColor() });

    this.setState({
      courses: [],
      keyword: '',
    });
    this.inputRef.current.focus();
  }

  handleToggleAttribute(attribute) {
    const { attributes } = this.state;
    this.setState({
      attributes: attributes.includes(attribute) ?
        attributes.filter(v => v !== attribute) :
        [...attributes, attribute],
    });
  }

  render() {
    const { className } = this.props;
    const { courses, keyword, attributes, activeIndex } = this.state;

    const activeCourse = courses[activeIndex];

    return (
      <div className={classes('CourseAdd', className)}>
        <div className="add">
          <div className="primary">
            <FontAwesomeIcon className={classes('icon', courses.length && 'active')} fixedWidth icon={faPlus}/>
            <div className="keyword-wrapper">
              {
                activeCourse && (
                  <div className={classes('keyword', 'autocomplete')}>
                    {activeCourse.id}
                  </div>
                )
              }
              <input type="text"
                     ref={this.inputRef}
                     value={keyword}
                     onChange={this.handleChangeKeyword}
                     className="keyword"
                     placeholder="XX 0000"
                     onKeyDown={this.handleKeyDown}/>
            </div>
          </div>
          <div className="secondary">
            <div className={classes('attribute', attributes.length === 0 && 'active')}
                 onClick={() => this.setState({ attributes: [] })}>
              All
            </div>
            {
              INSTRUCTIONAL_METHOD_ATTRIBUTES.map(attribute => (
                <div className={classes('attribute', attributes.includes(attribute) && 'active')} key={attribute}
                     onClick={() => this.handleToggleAttribute(attribute)}>
                  {refineInstructionalMethodAttribute(attribute)}
                </div>
              ))
            }
          </div>
        </div>
        {
          courses.map(course => (
            <Course
              key={course.id}
              className={course === activeCourse && 'active'}
              courseId={course.id}
              pinnedCrns={[]}
              onAddCourse={() => this.handleAddCourse(course)}
            />
          ))
        }
      </div>
    );
  }
}

export default connect(({ db, user }) => ({ db, user }), actions)(CourseAdd);
