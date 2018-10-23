import React, { Component } from 'react';
import './Calendar.scss';
import { CLOSE, OPEN } from './constants';
import { classes, timeToString } from './utils';
import Section from './Section';

class Calendar extends Component {
  render() {
    const { className, pinnedCrns, overlayCrns, crns, preview } = this.props;

    return (
      <div className={classes('Calendar', preview && 'preview', className)}>
        {
          !preview &&
          <div className="times">
            {
              new Array((CLOSE - OPEN) / 60).fill(0).map((_, i) => {
                const time = OPEN + i * 60;
                return (
                  <div className="time" key={time}>
                    <span className="label">
                      {timeToString(time)}
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
              ['M', 'T', 'W', 'R', 'F'].map(day => (
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
              <Section key={crn} section={crns[crn]} preview={preview}/>
            ))
          }
          {
            overlayCrns.filter(crn => !pinnedCrns.includes(crn)).map(crn => (
              <Section key={crn} section={crns[crn]} overlay preview={preview}/>
            ))
          }
        </div>
      </div>
    );
  }
}


export default Calendar;
