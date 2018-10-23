const stringToTime = string => {
  const [, hour, minute, ampm] = /(\d{1,2}):(\d{2}) (a|p)m/.exec(string);
  return ((ampm === 'p' ? 12 : 0) + Number.parseInt(hour % 12)) * 60 + Number.parseInt(minute);
};

const timeToString = (time, ampm = true) => {
  const hour = time / 60 | 0;
  const minute = time % 60;
  return `${hour > 12 ? hour - 12 : hour}:${minute < 10 ? '0' + minute : minute}${ampm ? ` ${hour < 12 ? 'a' : 'p'}m` : ''}`;
};

const periodToString = period => period ? `${timeToString(period.start, false)} - ${timeToString(period.end)}` : 'TBA';

const getRandomColor = (from = 0, to = 256) => {
  let hex = '#';
  for (let i = 0; i < 3; i++) {
    const component = (Math.random() * (to - from) + from | 0).toString(16);
    hex += (component.length === 1 ? '0' : '') + component;
  }
  return hex;
};

const hasConflictBetween = (section1, section2) =>
  section1.meetings.some(meeting1 =>
    section2.meetings.some(meeting2 =>
      meeting1.period && meeting2.period &&
      ['M', 'T', 'W', 'R', 'F'].some(day => meeting1.days.includes(day) && meeting2.days.includes(day)) &&
      meeting1.period.start < meeting2.period.end && meeting2.period.start < meeting1.period.end));

const classes = (...classList) => classList.filter(c => c).join(' ');

export {
  stringToTime,
  timeToString,
  periodToString,
  getRandomColor,
  hasConflictBetween,
  classes,
};
