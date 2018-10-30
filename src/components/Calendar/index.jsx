import React from 'react';
import { connect } from 'react-redux';
import { CLOSE, OPEN, DAYS } from '../../constants';
import { classes, timeToShortString } from '../../utils';
import { actions } from '../../reducers';
import { Section, SemiPureComponent } from '../';
import './stylesheet.scss';

class Calendar extends SemiPureComponent {
  render() {
    const { className, overlayCrns, preview } = this.props;
    const { mobile } = this.props.env;
    const { pinnedCrns } = this.props.user;

    return (
      <div className={classes('Calendar', mobile && 'mobile', preview && 'preview', className)}>
        {
          preview &&
          <img className="ratio" src="5x2.png" alt=""/>
        }
        {
          !preview &&
          <div className="times">
            {
              new Array((CLOSE - OPEN) / 60).fill(0).map((_, i) => {
                const time = OPEN + i * 60;
                return (
                  <div className="time" key={time}>
                    <span className="label">
                      {timeToShortString(time)}
                    </span>
                  </div>
                );
              })
            }
          </div>
        }
        {
          !preview &&
          <div className="days">
            {
              DAYS.map(day => (
                <div className="day" key={day}>
                    <span className="label">
                      {day}
                    </span>
                </div>
              ))
            }
          </div>
        }
        <div className="meetings">
          {
            pinnedCrns.map(crn => (
              <Section key={crn} crn={crn} preview={preview}/>
            ))
          }
          {
            overlayCrns &&
            overlayCrns.filter(crn => !pinnedCrns.includes(crn)).map(crn => (
              <Section key={crn} crn={crn} overlay={!preview} preview={preview}/>
            ))
          }
        </div>
      </div>
    );
  }
}


export default connect(({ env, user }) => ({ env, user }), actions)(Calendar);
