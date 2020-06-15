import { DAYS } from './constants';

const stringToTime = (string) => {
  const [, hour, minute, ampm] = /(\d{1,2}):(\d{2}) (a|p)m/.exec(string);
  return (
    ((ampm === 'p' ? 12 : 0) + Number.parseInt(hour % 12)) * 60 +
    Number.parseInt(minute)
  );
};

const timeToString = (time, ampm = true) => {
  const hour = (time / 60) | 0;
  const minute = time % 60;
  return `${hour > 12 ? hour - 12 : hour}:${
    minute < 10 ? '0' + minute : minute
  }${ampm ? ` ${hour < 12 ? 'a' : 'p'}m` : ''}`;
};

const timeToShortString = (time) => {
  const hour = (time / 60) | 0;
  return `${hour > 12 ? hour - 12 : hour}${hour < 12 ? 'a' : 'p'}m`;
};

const periodToString = (period) =>
  period
    ? `${timeToString(period.start, false)} - ${timeToString(period.end)}`
    : 'TBA';

const getRandomColor = (from = 0, to = 256) => {
  let hex = '#';
  for (let i = 0; i < 3; i++) {
    const component = ((Math.random() * (to - from) + from) | 0).toString(16);
    hex += (component.length === 1 ? '0' : '') + component;
  }
  return hex;
};

const getContentClassName = (color = '#BBBBBB') => {
  const r = parseInt(color.substring(1, 3), 16);
  const g = parseInt(color.substring(3, 5), 16);
  const b = parseInt(color.substring(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 128
    ? 'dark-content'
    : 'light-content';
};

const hasConflictBetween = (section1, section2) =>
  section1.meetings.some((meeting1) =>
    section2.meetings.some(
      (meeting2) =>
        meeting1.period &&
        meeting2.period &&
        DAYS.some(
          (day) => meeting1.days.includes(day) && meeting2.days.includes(day)
        ) &&
        meeting1.period.start < meeting2.period.end &&
        meeting2.period.start < meeting1.period.end
    )
  );

const classes = (...classList) => classList.filter((c) => c).join(' ');

const isMobile = () => window.innerWidth < 768;

const shallowCompareEntries = (a, b) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) => key in b && a[key] === b[key])
  );
};

const simplifyName = (name) => {
  const tokens = name.split(' ');
  const firstName = tokens.shift();
  const lastName = tokens.pop();
  return [firstName, lastName].join(' ');
};

const unique = (array) => [...new Set(array)];

const isLab = (section) => section.scheduleType.includes('Lab');

const isLecture = (section) => section.scheduleType.includes('Lecture');

const getSemesterName = (term) => {
  const year = term.substring(0, 4);
  const semester = (() => {
    switch (Number.parseInt(term.substring(4))) {
      case 1:
        return 'Winter';
      case 2:
      case 3:
        return 'Spring';
      case 5:
      case 6:
        return 'Summer';
      case 8:
      case 9:
        return 'Fall';
      default:
        return 'Unknown';
    }
  })();
  return `${semester} ${year}`;
};

export {
  stringToTime,
  timeToString,
  timeToShortString,
  periodToString,
  getRandomColor,
  getContentClassName,
  hasConflictBetween,
  classes,
  isMobile,
  shallowCompareEntries,
  simplifyName,
  unique,
  isLab,
  isLecture,
  getSemesterName,
};
