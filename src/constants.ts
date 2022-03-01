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

const CREDIT: Record<string, string> = {
  'No credit hours': '0.0',
  '1 credit hours': '1.0',
  '2 credit hours': '2.0',
  '3 credit hours': '3.0',
  '4 or more credit hours': '4.0+',
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  'Start Time': 'Any Time',
  'End Time': 'Any Time',
  Undergrad: 'Undergraduate',
  Grad: 'Graduate',
};

const TIMES: Record<string, string> = {
  '9:30am': '9:30am',
  '10:30am': '10:30am',
  '11:30am': '11:30am',
  '12:30am': '12:30am',
};

const CLASS_TIMESTAMPS: Array<string> = [
  'Any time',
  '8:00 am',
  '9:00 am',
  '10:00 am',
  '11:00 am',
  '12:00 pm',
  '1:00 pm',
  '2:00 pm',
  '3:00 pm',
  '4:00 pm',
  '5:00 pm',
  '6:00 pm',
  '7:00 pm',
  '8:00 pm',
  '9:00 pm',
  '10:00 pm',
];

const BACKEND_BASE_URL = 'https://gt-scheduler.azurewebsites.net';

const LARGE_DESKTOP_BREAKPOINT = 1200;
const DESKTOP_BREAKPOINT = 1024;
const LARGE_MOBILE_BREAKPOINT = 600;

export {
  OPEN,
  CLOSE,
  DAYS,
  PNG_SCALE_FACTOR,
  PALETTE,
  ASYNC_DELIVERY_MODE,
  DELIVERY_MODES,
  CAMPUSES,
  CREDIT,
  BACKEND_BASE_URL,
  DESKTOP_BREAKPOINT,
  LARGE_MOBILE_BREAKPOINT,
  LARGE_DESKTOP_BREAKPOINT,
  TIMES,
  CLASS_TIMESTAMPS,
};
