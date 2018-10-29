import React from 'react';
import { connect } from 'react-redux';
import { Calendar, SemiPureComponent } from '../';
import { classes, hasConflictBetween } from '../../utils';
import { actions } from '../../reducers';
import './stylesheet.scss';

class Combinations extends SemiPureComponent {
  getCombinations() {
    const { courses, crns } = this.props.oscar;
    const { desiredCourses, pinnedCrns, excludedCrns } = this.props.user;

    const combinations = [];
    const dfs = (courseIndex = 0, combination = []) => {
      if (courseIndex === desiredCourses.length) {
        combinations.push(combination);
        return;
      }
      const course = courses[desiredCourses[courseIndex]];
      const isIncluded = section => !excludedCrns.includes(section.crn);
      const isPinned = section => pinnedCrns.includes(section.crn);
      const hasConflict = section => [...pinnedCrns, ...combination].some(crn => hasConflictBetween(crns[crn], section));
      if (course.hasLab) {
        const pinnedLectures = course.lectures.filter(isPinned);
        const pinnedLabs = course.labs.filter(isPinned);
        if (pinnedLabs.length) {
          pinnedLabs.forEach(lab => {
            lab.lectures.filter(isIncluded).forEach(lecture => {
              if (isPinned(lecture)) {
                dfs(courseIndex + 1, combination);
              } else {
                if (hasConflict(lecture)) return;
                dfs(courseIndex + 1, [...combination, lecture.crn]);
              }
            });
          });
        } else if (pinnedLectures.length) {
          pinnedLectures.forEach(lecture => {
            lecture.labs.filter(isIncluded).forEach(lab => {
              if (hasConflict(lab)) return;
              dfs(courseIndex + 1, [...combination, lab.crn]);
            });
          });
        } else {
          course.lectures.filter(isIncluded).forEach(lecture => {
            if (hasConflict(lecture)) return;
            lecture.labs.filter(isIncluded).forEach(lab => {
              if (hasConflict(lab)) return;
              dfs(courseIndex + 1, [...combination, lecture.crn, lab.crn]);
            });
          });
        }
      } else {
        const sections = Object.values(course.sections);
        if (sections.some(isPinned)) {
          dfs(courseIndex + 1, combination);
        } else {
          Object.values(course.sectionGroups).forEach(sectionGroup => {
            const section = sectionGroup.sections.find(isIncluded);
            if (!section || hasConflict(section)) return;
            dfs(courseIndex + 1, [...combination, section.crn]);
          });
        }
      }
    };
    dfs();
    return combinations;
  }

  render() {
    const { className, onSetOverlayCrns, onSetPinnedCrns } = this.props;
    const { pinnedCrns } = this.props.user;

    const combinations = this.getCombinations();

    return (
      <div className={classes('Combinations', className)}>
        {
          combinations.map((combination, i) => (
            <div className="combination" key={i}
                 onMouseEnter={() => onSetOverlayCrns(combination)}
                 onMouseLeave={() => onSetOverlayCrns([])}
                 onClick={() => onSetPinnedCrns([...pinnedCrns, ...combination])}>
              <div className="number">{i + 1}</div>
              <Calendar className="preview" overlayCrns={combination} preview/>
            </div>
          ))
        }
      </div>
    );
  }
}


export default connect(({ oscar, user }) => ({ oscar, user }), actions)(Combinations);
