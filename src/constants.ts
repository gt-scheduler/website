import { firebaseConfig } from './data/firebase';

const OPEN = 8 * 60;
const CLOSE = 22 * 60;
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
  'GT, Peking University, & Emory': 'Peking & Emory',
  'Georgia Tech-Savannah': 'Savannah',
  'Georgia Tech - Korea': 'Korea',
  'Georgia Tech - Shanghai': 'Shanghai',
};

const COURSE_TABS = ['Courses', 'Recurring Events'];
const COURSES = 0;
const RECURRING_EVENTS = 1;

const BACKEND_BASE_URL = 'https://gt-scheduler.azurewebsites.net';
const FIREBASE_PROJECT_ID = firebaseConfig.projectId || `gt-scheduler-web-dev`;
const CLOUD_FUNCTION_BASE_URL = `https://us-east1-${FIREBASE_PROJECT_ID}.cloudfunctions.net`;

// Use with served url in env file if you want to run with a local crawler
// eg. http://localhost:8080
const CUSTOM_CRAWLER_URL = process.env['REACT_APP_LOCAL_CRAWLER_URL'];
const CRAWLER_BASE_URL =
  CUSTOM_CRAWLER_URL || 'https://gt-scheduler.github.io/crawler-v2';

const DONATE_LINK = 'https://opencollective.com/georgia-tech';

const LARGE_DESKTOP_BREAKPOINT = 1200;
const DESKTOP_BREAKPOINT = 1024;
const LARGE_MOBILE_BREAKPOINT = 600;

export {
  OPEN,
  CLOSE,
  CRAWLER_BASE_URL,
  COURSE_TABS,
  COURSES,
  RECURRING_EVENTS,
  DAYS,
  PNG_SCALE_FACTOR,
  PALETTE,
  ASYNC_DELIVERY_MODE,
  DELIVERY_MODES,
  CAMPUSES,
  BACKEND_BASE_URL,
  CLOUD_FUNCTION_BASE_URL,
  DONATE_LINK,
  DESKTOP_BREAKPOINT,
  LARGE_MOBILE_BREAKPOINT,
  LARGE_DESKTOP_BREAKPOINT,
};
