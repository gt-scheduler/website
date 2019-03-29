import React from 'react';
import { connect } from 'react-redux';
import { Calendar, SemiPureComponent } from '../';
import { classes } from '../../utils';
import { actions } from '../../reducers';
import './stylesheet.scss';

class Combinations extends SemiPureComponent {
  constructor(props) {
    super(props);
  }

  handleSetPinnedCrns(pinnedCrns) {
    this.props.setPinnedCrns(pinnedCrns);
  }

  render() {
    const { className, onSetOverlayCrns, combinations } = this.props;
    const { pinnedCrns } = this.props.user;

    return (
      <div className={classes('Combinations', className)}>
        {
          combinations.map(({ crns }, i) => (
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
    );
  }
}


export default connect(({ db, user }) => ({ db, user }), actions)(Combinations);
