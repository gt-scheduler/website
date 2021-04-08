import React, { useCallback, useContext, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAdjust,
  faCalendarAlt,
  faDownload,
  faPaste
} from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import ReactTooltip from 'react-tooltip';
import copy from 'copy-to-clipboard';
import Cookies from 'js-cookie';
import domtoimage from 'dom-to-image';
import { saveAs } from 'file-saver';

import { Button } from '..';
import { classes } from '../../utils';
import { PNG_SCALE_FACTOR } from '../../constants';
import { ScheduleContext, ThemeContext } from '../../contexts';
import ics from '../../libs/ics';
import { ICS } from '../../types';

import './stylesheet.scss';

export type HeaderActionBarProps = {
  captureRef: React.RefObject<HTMLElement>;
  style?: React.CSSProperties;
  className?: string;
};

/**
 * Displays the icon buttons (with optional text)
 * that appear at the top of the app in the header,
 * or if on a small mobile device, at the top of the app nav drawer,
 */
export default function HeaderActionBar({
  captureRef,
  style,
  className
}: HeaderActionBarProps) {
  const [{ oscar, pinnedCrns }] = useContext(ScheduleContext);
  const [theme, setTheme] = useContext(ThemeContext);

  const handleThemeChange = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    Cookies.set('theme', newTheme, { expires: 1460 });
    setTheme(newTheme);
  }, [theme, setTheme]);

  const handleExport = useCallback(() => {
    const cal = ics() as ICS | undefined;
    if (cal == null) {
      window.alert('This browser does not support calendar export');
      return;
    }

    pinnedCrns.forEach((crn) => {
      const section = oscar.findSection(crn);
      // TODO supply better types
      section.meetings.forEach((meeting: any) => {
        if (!meeting.period || !meeting.days.length) return;
        const { from, to } = meeting.dateRange;
        const subject = section.course.id;
        const description = section.course.title;
        const location = meeting.where;
        const begin = new Date(from.getTime());
        while (
          !meeting.days.includes(
            ['-', 'M', 'T', 'W', 'R', 'F', '-'][begin.getDay()]
          )
        ) {
          begin.setDate(begin.getDate() + 1);
        }
        begin.setHours(meeting.period.start / 60, meeting.period.start % 60);
        const end = new Date(begin.getTime());
        end.setHours(meeting.period.end / 60, meeting.period.end % 60);
        const rrule = {
          freq: 'WEEKLY',
          until: to,
          byday: meeting.days.map(
            (day: 'M' | 'T' | 'W' | 'R' | 'F') =>
              ({ M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR' }[day])
          )
        };
        cal.addEvent(subject, description, location, begin, end, rrule);
      });
    });
    cal.download('gt-scheduler');
  }, [oscar, pinnedCrns]);

  const handleDownload = useCallback(() => {
    const captureElement = captureRef.current;
    if (captureElement == null) return;

    const computed = window
      .getComputedStyle(captureElement)
      .getPropertyValue('left');

    domtoimage
      .toBlob(captureElement, {
        width: captureElement.offsetWidth * PNG_SCALE_FACTOR,
        height: captureElement.offsetHeight * PNG_SCALE_FACTOR,
        style: {
          transform: `scale(${PNG_SCALE_FACTOR})`,
          'transform-origin': `${computed} 0px`,
          'background-color': theme === 'light' ? '#FFFFFF' : '#333333'
        }
      })
      .then((blob) => saveAs(blob, 'schedule.png'));
  }, [captureRef, theme]);

  // Obtain a ref to the copy button to only close its tooltip
  const crnButton = useRef<HTMLDivElement>(null);

  return (
    <div className={classes('header-action-bar', className)} style={style}>
      <Button onClick={handleDownload} disabled={pinnedCrns.length === 0}>
        <FontAwesomeIcon className="icon" fixedWidth icon={faDownload} />
        <div className="text">Download</div>
      </Button>
      <Button onClick={handleExport} disabled={pinnedCrns.length === 0}>
        <FontAwesomeIcon className="icon" fixedWidth icon={faCalendarAlt} />
        <div className="text">Export</div>
      </Button>

      {/* Include separate button and tooltip component
      with manually controlled closing logic */}
      <div
        className="menu"
        data-tip
        data-for="copy-crn"
        delay-hide="1000"
        ref={crnButton}
      >
        <Button disabled={pinnedCrns.length === 0}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faPaste} />
          <div className="text">CRNs</div>
        </Button>
      </div>
      {/* Only enable the tooltip logic if there are CRNS to copy */}
      {pinnedCrns.length > 0 && (
        <ReactTooltip
          id="copy-crn"
          type="dark"
          place="bottom"
          effect="solid"
          event="click"
          delayHide={1000}
          afterShow={() => {
            copy(pinnedCrns.join(', '));
            setTimeout(
              () => ReactTooltip.hide(crnButton.current ?? undefined),
              1000
            );
          }}
        >
          Copied to clipboard!
        </ReactTooltip>
      )}

      <Button onClick={handleThemeChange}>
        <FontAwesomeIcon className="icon" fixedWidth icon={faAdjust} />
        <div className="text">Theme</div>
      </Button>
      <Button href="https://github.com/gt-scheduler/website">
        <FontAwesomeIcon className="icon" fixedWidth icon={faGithub} />
        <div className="text">GitHub</div>
      </Button>
    </div>
  );
}
