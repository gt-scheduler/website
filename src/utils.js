import { DAYS, PALETTE, DESKTOP_BREAKPOINT } from './constants';

const stringToTime = (string) => {
  const [, hour, minute, ampm] = /(\d{1,2}):(\d{2}) (a|p)m/.exec(string);
  return ((ampm === 'p' ? 12 : 0) + (+hour % 12)) * 60 + +minute;
};

const timeToString = (time, ampm = true) => {
  const hour = (time / 60) | 0;
  const minute = time % 60;
  const hh = hour > 12 ? hour - 12 : hour;
  const mm = `${minute}`.padStart(2, '0');
  const A = `${hour < 12 ? 'a' : 'p'}m`;
  return ampm ? `${hh}:${mm} ${A}` : `${hh}:${mm}`;
};

const timeToShortString = (time) => {
  const hour = (time / 60) | 0;
  return `${hour > 12 ? hour - 12 : hour}${hour < 12 ? 'a' : 'p'}m`;
};

const periodToString = (period) =>
  period
    ? `${timeToString(period.start, false)} - ${timeToString(period.end)}`
    : 'TBA';

const getRandomColor = () => {
  const colors = PALETTE.flat();
  const index = (Math.random() * colors.length) | 0;
  return colors[index];
};

const getContentClassName = (color) => {
  const r = parseInt(color.substring(1, 3), 16);
  const g = parseInt(color.substring(3, 5), 16);
  const b = parseInt(color.substring(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 128
    ? 'light-content'
    : 'dark-content';
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

const isMobile = () => window.innerWidth < DESKTOP_BREAKPOINT;

const simplifyName = (name) => {
  const tokens = name.split(' ');
  const firstName = tokens.shift();
  const lastName = tokens.pop();
  return [firstName, lastName].join(' ');
};

const unique = (array) => [...new Set(array)];

const isLab = (section) =>
  ['Lab', 'Studio'].some((type) => section.scheduleType.includes(type));

const isLecture = (section) => section.scheduleType.includes('Lecture');

const getSemesterName = (term) => {
  const year = term.substring(0, 4);
  const semester = (() => {
    switch (Number.parseInt(term.substring(4), 10)) {
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

const getSemesterMonth = (term) => {
  const year = term.split(' ')[1];
  const month = (() => {
    switch (term.split(' ')[0]) {
      case 'Winter':
        return '12';
      case 'Spring':
        return '02';
      case 'Summer':
        return '05';
      case 'Fall':
        return '08';
      default:
        return 'Unknown';
    }
  })();
  return `${year}${month}`;
};

const humanizeArray = (array, conjunction = 'and') => {
  if (array.length <= 2) {
    return array.join(` ${conjunction} `);
  }
  const init = [...array];
  const last = init.pop();
  return `${init.join(', ')}, ${conjunction} ${last}`;
};

const decryptReqs = (reqs, openPar = false, closePar = false) => {
  const last = (i) => i === reqs.length - 2;
  let string = '';

  if (!reqs[0])
    string += (openPar ? '(' : '') + reqs.id + (closePar ? ')' : '');
  else if (reqs[0] === 'and')
    reqs.slice(1, reqs.length).forEach((req, i) => {
      string += decryptReqs(req, i === 0, last(i)) + (last(i) ? '' : ' and ');
    });
  else if (reqs[0] === 'or')
    reqs.slice(1, reqs.length).forEach((req, i) => {
      string += decryptReqs(req) + (last(i) ? '' : ' or ');
    });
  else
    reqs.forEach((req, i) => {
      string += req.id + (i === reqs.length - 1 ? '' : ' or ');
    });

  return string;
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
  simplifyName,
  unique,
  isLab,
  isLecture,
  getSemesterName,
  getSemesterMonth,
  humanizeArray,
  decryptReqs
};
