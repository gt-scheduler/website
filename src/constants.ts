const OPEN = 8 * 60;
const CLOSE = 21 * 60;
const DAYS = ['M', 'T', 'W', 'R', 'F'];

const PNG_SCALE_FACTOR = 2;

const PALETTE = [
  [
    '#4D4D4D',
    '#999999',
    '#FFFFFF',
    '#F44E3B',
    '#FE9200',
    '#FCDC00',
    '#DBDF00',
    '#A4DD00',
    '#68CCCA',
    '#73D8FF',
    '#AEA1FF',
    '#FDA1FF',
  ],
  [
    '#333333',
    '#808080',
    '#CCCCCC',
    '#D33115',
    '#E27300',
    '#FCC400',
    '#B0BC00',
    '#68BC00',
    '#16A5A5',
    '#009CE0',
    '#7B64FF',
    '#FA28FF',
  ],
  [
    '#000000',
    '#666666',
    '#B3B3B3',
    '#9F0500',
    '#C45100',
    '#FB9E00',
    '#808900',
    '#194D33',
    '#0C797D',
    '#0062B1',
    '#653294',
    '#AB149E',
  ],
];

const ASYNC_DELIVERY_MODE = 'Remote Asynchronous Course';

const DELIVERY_MODES: Record<string, string> = {
  'Hybrid Course': 'Hybrid',
  'Remote Synchronous Course': 'Remote Synchronous',
  'Remote Asynchronous Course': 'Remote Asynchronous',
  'Residential Course': 'Residential',
};

const CAMPUSES: Record<string, string> = {
  'Georgia Tech-Atlanta *': 'Atlanta',
  'GT Lorraine-Undergrad Programs': 'Lorraine Undergrad',
  'GT Lorraine-Graduate Programs': 'Lorraine Graduate',
  'Georgia Tech - Shenzhen': 'Shenzhen',
  Video: 'Video',
  Online: 'Online',
  'MBA Evening Program': 'MBA Evening',
};

const TIMES: Record<string, string> = {
  '9:30am': '9:30am',
  '10:30am': '10:30am',
  '11:30am': '11:30am',
  '12:30am': '12:30am',
};

const CLASS_TIMESTAMPS: Record<string, number> = {
  '8:00 am': 480,
  '9:00 am': 540,
  '10:00 am': 600,
  '11:00 am': 660,
  '12:00 pm': 720,
  '1:00 pm': 780,
  '2:00 pm': 840,
  '3:00 pm': 900,
  '4:00 pm': 960,
  '5:00 pm': 1020,
  '6:00 pm': 1080,
  '7:00 pm': 1140,
  '8:00 pm': 1360,
  '9:00 pm': 1260,
};

const ANY_TIME = 'Any time';

const CREDIT_HOURS: Array<string> = ['0', '1', '2', '3', '4'];
const COURSE_LEVEL: Array<string> = ['Undergraduate', 'Graduate'];

const BACKEND_BASE_URL = 'https://gt-scheduler.azurewebsites.net';

const LARGE_DESKTOP_BREAKPOINT = 1200;
const DESKTOP_BREAKPOINT = 1024;
const LARGE_MOBILE_BREAKPOINT = 600;

const COURSE_CARD_TYPES = {
  Schedule: 'schedule',
  CourseSearch: 'courseSearch',
  MyCourse: 'mycourse',
};

export {
  OPEN,
  CLOSE,
  DAYS,
  PNG_SCALE_FACTOR,
  PALETTE,
  ASYNC_DELIVERY_MODE,
  DELIVERY_MODES,
  CAMPUSES,
  CREDIT_HOURS,
  COURSE_LEVEL,
  BACKEND_BASE_URL,
  DESKTOP_BREAKPOINT,
  LARGE_MOBILE_BREAKPOINT,
  LARGE_DESKTOP_BREAKPOINT,
  TIMES,
  CLASS_TIMESTAMPS,
  ANY_TIME,
  COURSE_CARD_TYPES,
};
