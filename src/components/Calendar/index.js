import React, { useContext } from 'react';
import { CLOSE, DAYS, OPEN } from '../../constants';
import { classes, timeToShortString } from '../../utils';
import { TimeBlocks } from '..';
import './stylesheet.scss';
import { TermContext } from '../../contexts';

export default function Calendar({
  className,
  overlayCrns,
  preview,
  capture,
  isAutosized
}) {
  const [{ pinnedCrns, oscar }] = useContext(TermContext);

  const dayMap = DAYS.reduce((acc, day) => {
    acc[day] = {};
    return acc;
  }, {});

  const crns = [...new Set([...pinnedCrns, ...(overlayCrns || [])])];
  const meetingLen = (m) => m.period.end - m.period.start;
  crns.sort(
    (a, b) =>
      Math.max(...oscar.findSection(a).meetings.map(meetingLen)) -
      Math.max(...oscar.findSection(b).meetings.map(meetingLen))
  );

  crns.forEach((crn) => {
    oscar.findSection(crn).meetings.forEach((meeting) => {
      meeting.days.forEach((day) => {
        let curRowSize = 1;

        Object.values(dayMap[day])
          .filter(
            (entry) =>
              entry.period.start < meeting.period.end &&
              entry.period.end > meeting.period.start
          )
          .forEach((entry) => {
            curRowSize = Math.max(curRowSize, entry.rowSize + 1);
          });

        const updatePrevious = (arr, seen, curCrn, curPeriod) => {
          if (seen.has(curCrn)) {
            return;
          }
          seen.add(curCrn);

          arr
            .filter(
              (entry) =>
                entry.period.start < curPeriod.end &&
                entry.period.end > curPeriod.start
            )
            .forEach((entry) => {
              entry.rowSize = curRowSize;
              updatePrevious(arr, seen, entry.crn, entry.period);
            });
        };

        updatePrevious(
          Object.values(dayMap[day]),
          new Set(),
          crn,
          meeting.period
        );

        dayMap[day][
          [crn, meeting.period.start, meeting.period.end].join('-')
        ] = {
          crn,
          period: meeting.period,
          rowIndex: curRowSize - 1,
          rowSize: curRowSize
        };
      });
    });
  });

  return (
    <div
      className={classes(
        'Calendar',
        capture && 'capture',
        preview && 'preview',
        className
      )}
    >
      {!preview && (
        <div className="times">
          {new Array((CLOSE - OPEN) / 60).fill(0).map((_, i) => {
            const time = OPEN + i * 60;
            return (
              <div className="time" key={time}>
                <span className="label">{timeToShortString(time)}</span>
              </div>
            );
          })}
        </div>
      )}
      {!preview && (
        <div className="days">
          {DAYS.map((day) => (
            <div className="day" key={day}>
              <span className="label">{day}</span>
            </div>
          ))}
        </div>
      )}
      <div className="meetings">
        {pinnedCrns.map((crn) => (
          <TimeBlocks
            key={crn}
            crn={crn}
            preview={preview}
            capture={capture}
            isAutosized={isAutosized}
            dayMap={dayMap}
          />
        ))}
        {overlayCrns &&
          overlayCrns
            .filter((crn) => !pinnedCrns.includes(crn))
            .map((crn) => (
              <TimeBlocks
                key={crn}
                crn={crn}
                overlay={!preview}
                preview={preview}
                capture={capture}
                isAutosized
                dayMap={dayMap}
              />
            ))}
      </div>
    </div>
  );
}
