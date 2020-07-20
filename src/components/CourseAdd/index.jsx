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
      keyword: '',
      attributes: [],
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
    const { keyword, attributes } = this.state;

    if (e.key === 'Enter') {
      e.preventDefault();
      const courses = oscar.searchCourses(keyword, attributes);
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
            (meeting) => !meeting.days.length || !meeting.period,
          ),
      )
      .map((section) => section.crn);
    this.props.setDesiredCourses([...desiredCourses, course.id]);
    this.props.setExcludedCrns([...excludedCrns, ...tbaCrns]);
    this.props.setColorMap({ ...colorMap, [course.id]: getRandomColor() });

    this.setState({ keyword: '' });
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
    const { oscar } = this.props.db;
    const { desiredCourses, pinnedCrns } = this.props.user;
    const { keyword, attributes } = this.state;

    const courses = oscar
      .searchCourses(keyword, attributes)
      .filter((course) => !desiredCourses.includes(course.id));

    return (
      <div className={classes('CourseAdd', className)}>
        <div className="add">
          <div className="primary">
            <FontAwesomeIcon className={classes('icon', courses.length && 'active')} fixedWidth icon={faPlus}/>
            <input type="text"
                   ref={this.inputRef}
                   value={keyword}
                   onChange={this.handleChangeKeyword}
                   className="keyword"
                   placeholder="XX 0000"
                   onKeyPress={this.handlePressEnter}/>
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
          courses.map((course) => (
            <Course
              key={course.id}
              courseId={course.id}
              pinnedCrns={pinnedCrns}
              onAddCourse={() => this.handleAddCourse(course)}
            />
          ))
        }
      </div>
    );
  }
}

export default connect(({ db, user }) => ({ db, user }), actions)(CourseAdd);
