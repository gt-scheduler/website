import React, { PureComponent } from 'react';
import { Course } from '../';
import { classes } from '../../utils';
import './stylesheet.scss';

class CourseAdd extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      keyword: '',
    };

    this.inputRef = React.createRef();

    this.handleChangeKeyword = this.handleChangeKeyword.bind(this);
    this.handlePressEnter = this.handlePressEnter.bind(this);
    this.handleAddCourse = this.handleAddCourse.bind(this);
  }

  searchCourses(keyword) {
    const { courses } = this.props;
    const [, inputSubject, inputNumber] = /^\s*([a-zA-Z]*)\s*(\d*)\s*$/.exec(keyword.toUpperCase()) || [];
    if (inputSubject || inputNumber) {
      return Object.values(courses).filter(course => {
        const [subject, number] = course.id.split(' ');
        if (inputSubject && inputNumber) {
          return subject === inputSubject && number.startsWith(inputNumber);
        } else if (inputSubject) {
          return subject.startsWith(inputSubject);
        } else {
          return number.startsWith(inputNumber);
        }
      });
    } else {
      return [];
    }
  }

  handleChangeKeyword(e) {
    const keyword = e.target.value;
    this.setState({ keyword });
  }

  handlePressEnter(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const courses = this.searchCourses(this.state.keyword);
      if (courses.length) this.handleAddCourse(courses[0]);
    }
  }

  handleAddCourse(course) {
    const { onAddCourse } = this.props;
    onAddCourse(course);
    this.setState({ keyword: '' });
    this.inputRef.current.focus();
  }

  render() {
    const { className, pinnedCrns } = this.props;
    const { keyword } = this.state;

    return (
      <div className={classes('CourseAdd', className)}>
        <input type="text" ref={this.inputRef} value={keyword} onChange={this.handleChangeKeyword}
               className="keyword"
               placeholder="XX 0000" onKeyPress={this.handlePressEnter}/>
        <div className="autocomplete">
          {
            keyword &&
            this.searchCourses(keyword).map(course => (
              <Course course={course} onClick={() => this.handleAddCourse(course)} key={course.id}
                      pinnedCrns={pinnedCrns}/>
            ))
          }
        </div>
      </div>
    );
  }
}


export default CourseAdd;
