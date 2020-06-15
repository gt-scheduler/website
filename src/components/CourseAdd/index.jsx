import React from 'react';
import { connect } from 'react-redux';
import { Course, SemiPureComponent } from '../';
import { classes, getRandomColor } from '../../utils';
import { actions } from '../../reducers';
import './stylesheet.scss';

class CourseAdd extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.state = {
      keyword: '',
    };

    this.inputRef = React.createRef();

    this.handleChangeKeyword = this.handleChangeKeyword.bind(this);
    this.handlePressEnter = this.handlePressEnter.bind(this);
  }

  handleChangeKeyword(e) {
    const keyword = e.target.value;
    this.setState({ keyword });
  }

  handlePressEnter(e) {
    const { oscar } = this.props.db;
    const { keyword } = this.state;

    if (e.key === 'Enter') {
      e.preventDefault();
      const courses = oscar.searchCourses(keyword);
      if (courses.length) this.handleAddCourse(courses[0]);
    }
  }

  handleAddCourse(course) {
    const { desiredCourses, excludedCrns, colorMap } = this.props.user;
    if (desiredCourses.includes(course.id)) return;
    const tbaCrns = course.sections
      .filter(
        (section) =>
          !section.meetings.length ||
          section.meetings.some(
            (meeting) => !meeting.days.length || !meeting.period
          )
      )
      .map((section) => section.crn);
    this.props.setDesiredCourses([...desiredCourses, course.id]);
    this.props.setExcludedCrns([...excludedCrns, ...tbaCrns]);
    this.props.setColorMap({ ...colorMap, [course.id]: getRandomColor() });

    this.setState({ keyword: '' });
    this.inputRef.current.focus();
  }

  render() {
    const { className } = this.props;
    const { oscar } = this.props.db;
    const { desiredCourses, pinnedCrns } = this.props.user;
    const { keyword } = this.state;

    return (
      <div className={classes('CourseAdd', className)}>
        <input
          type="text"
          ref={this.inputRef}
          value={keyword}
          onChange={this.handleChangeKeyword}
          className="keyword"
          placeholder="XX 0000"
          onKeyPress={this.handlePressEnter}
        />
        <div className="autocomplete">
          {oscar
            .searchCourses(keyword)
            .filter((course) => !desiredCourses.includes(course.id))
            .map((course) => (
              <Course
                key={course.id}
                courseId={course.id}
                pinnedCrns={pinnedCrns}
                onAddCourse={() => this.handleAddCourse(course)}
              />
            ))}
        </div>
      </div>
    );
  }
}

export default connect(({ db, user }) => ({ db, user }), actions)(CourseAdd);
