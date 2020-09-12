import React, { useCallback, useContext, useMemo, useRef } from 'react';
import { getSemesterName } from '../../utils';
import 'react-virtualized/styles.css';
import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAdjust,
  faCalendarAlt,
  faDownload,
  faPaste
} from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import Cookies from 'js-cookie';
import domtoimage from 'dom-to-image';
import saveAs from 'file-saver';
import { PNG_SCALE_FACTOR } from '../../constants';
import ics from '../../libs/ics';
import { Button, Calendar, Select } from '..';
import { TermContext, TermsContext, ThemeContext } from '../../contexts';

export function Header(props) {
  const [{ term, oscar, pinnedCrns }, { setTerm }] = useContext(TermContext);
  const [terms] = useContext(TermsContext);
  const [theme, setTheme] = useContext(ThemeContext);
  const captureRef = useRef(null);

  const handleThemeChange = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    Cookies.set('theme', newTheme, { expires: 1460 });
    setTheme(newTheme);
  }, [theme, setTheme]);

  const totalCredits = useMemo(() => {
    return pinnedCrns.reduce((credits, crn) => {
      return credits + oscar.findSection(crn).credits;
    }, 0);
  }, [pinnedCrns, oscar]);

  const handleExport = useCallback(() => {
    const cal = ics();
    pinnedCrns.forEach((crn) => {
      const section = oscar.findSection(crn);
      section.meetings.forEach((meeting) => {
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
        begin.setHours(
          (meeting.period.start / 60) | 0,
          meeting.period.start % 60
        );
        const end = new Date(begin.getTime());
        end.setHours((meeting.period.end / 60) | 0, meeting.period.end % 60);
        const rrule = {
          freq: 'WEEKLY',
          until: to,
          byday: meeting.days.map(
            (day) => ({ M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR' }[day])
          )
        };
        cal.addEvent(subject, description, location, begin, end, rrule);
      });
    });
    cal.download('gt-scheduler');
  }, [oscar, pinnedCrns]);

  const handleDownload = useCallback(() => {
    const captureElement = captureRef.current;
    domtoimage
      .toPng(captureElement, {
        width: captureElement.offsetWidth * PNG_SCALE_FACTOR,
        height: captureElement.offsetHeight * PNG_SCALE_FACTOR,
        style: {
          left: 0,
          transform: `scale(${PNG_SCALE_FACTOR})`,
          'transform-origin': 'top left'
        }
      })
      .then((blob) => saveAs(blob, 'schedule.png'));
  }, [captureRef]);

  return (
    <div className="Header">
      <Button className="logo">
        <span className="gt">GT </span>
        <span className="scheduler">Scheduler</span>
      </Button>
      <Select
        onChange={setTerm}
        value={term}
        options={terms.map((term) => ({
          value: term,
          label: getSemesterName(term)
        }))}
        className="semester"
      />
      <span className="credits">{totalCredits} Credits</span>
      <div className="menu">
        <Button onClick={handleDownload} disabled={pinnedCrns.length === 0}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faDownload} />
          <div className="text">Download</div>
        </Button>
        <Button onClick={handleExport} disabled={pinnedCrns.length === 0}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faCalendarAlt} />
          <div className="text">Export</div>
        </Button>
        <Button text={pinnedCrns.join(', ')} disabled={pinnedCrns.length === 0}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faPaste} />
          <div className="text">CRNs</div>
        </Button>
        <Button onClick={handleThemeChange}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faAdjust} />
          <div className="text">Theme</div>
        </Button>
        <Button href="https://github.com/64json/gt-scheduler">
          <FontAwesomeIcon className="icon" fixedWidth icon={faGithub} />
          <div className="text">GitHub</div>
        </Button>
      </div>
      <div className="capture-container" ref={captureRef}>
        <Calendar className="fake-calendar" capture />
      </div>
    </div>
  );
}
