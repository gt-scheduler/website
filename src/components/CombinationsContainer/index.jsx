import React from 'react';
import { connect } from 'react-redux';
import memoizeOne from 'memoize-one';
import { Button, Calendar, SemiPureComponent } from '../';
import { classes } from '../../utils';
import { actions } from '../../reducers';
import './stylesheet.scss';

class CombinationsContainer extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.sortingOptions = [{
      label: 'Most Compact',
      calculateFactor: combination => {
        const { startMap, endMap } = combination;
        const diffs = Object.keys(startMap).map(day => endMap[day] - startMap[day]);
        const sum = diffs.reduce((sum, min) => sum + min, 0);
        return +sum;
      },
    }, {
      label: 'Earliest Ending',
      calculateFactor: combination => {
        const { endMap } = combination;
        const ends = Object.values(endMap);
        const sum = ends.reduce((sum, end) => sum + end, 0);
        const avg = sum / ends.length;
        return +avg;
      },
    }, {
      label: 'Latest Beginning',
      calculateFactor: combination => {
        const { startMap } = combination;
        const starts = Object.values(startMap);
        const sum = starts.reduce((sum, min) => sum + min, 0);
        const avg = sum / starts.length;
        return -avg;
      },
    }];

    const { oscar } = this.props.db;

    this.memoizedGetCombinations = memoizeOne(oscar.getCombinations.bind(oscar));
    this.handleChangeSortingOptionIndex = this.handleChangeSortingOptionIndex.bind(this);
  }

  handleSetPinnedCrns(pinnedCrns) {
    this.props.setPinnedCrns(pinnedCrns);
  }

  handleResetPinnedCrns() {
    if (window.confirm('Are you sure to reset sections you selected?')) {
      this.handleSetPinnedCrns([]);
    }
  }

  handleChangeSortingOptionIndex(e) {
    const sortingOptionIndex = e.target.value;
    this.props.setSortingOptionIndex(sortingOptionIndex);
  }

  render() {
    const { className, onSetOverlayCrns } = this.props;
    const { desiredCourses, pinnedCrns, excludedCrns, sortingOptionIndex } = this.props.user;

    const combinations = this.memoizedGetCombinations(desiredCourses, pinnedCrns, excludedCrns);
    const sortingOption = this.sortingOptions[sortingOptionIndex];
    const sortedCombinations = combinations.map(combination => ({
      ...combination,
      factor: sortingOption.calculateFactor(combination),
    })).sort((a, b) => a.factor - b.factor);

    return (
      <div className={classes('CombinationsContainer', className)}>
        {
          pinnedCrns.length > 0 &&
          <Button onClick={() => this.handleResetPinnedCrns()}>
            Reset Sections
          </Button>
        }
        <Button className="sorting-option">
          <select onChange={this.handleChangeSortingOptionIndex} value={sortingOptionIndex}>
            {
              this.sortingOptions.map((sortingOption, i) => (
                <option key={i} value={i}>{sortingOption.label}</option>
              ))
            }
          </select>
        </Button>
        <div className="combinations">
          {
            sortedCombinations.map(({ crns }, i) => (
              <div className="combination" key={i}
                   onMouseEnter={() => onSetOverlayCrns(crns)}
                   onMouseLeave={() => onSetOverlayCrns([])}
                   onClick={() => this.handleSetPinnedCrns([...pinnedCrns, ...crns])}>
                <div className="number">{i + 1}</div>
                <Calendar className="preview" overlayCrns={crns} preview/>
              </div>
            ))
          }
        </div>
      </div>
    );
  }
}


export default connect(({ db, user }) => ({ db, user }), actions)(CombinationsContainer);
