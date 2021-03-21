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
    '#FDA1FF'
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
    '#FA28FF'
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
    '#AB149E'
  ]
];

const ASYNC_DELIVERY_MODE = 'Remote Asynchronous Course';

const DELIVERY_MODES = {
  'Hybrid Course': 'Hybrid',
  'Remote Synchronous Course': 'Remote Synchronous',
  'Remote Asynchronous Course': 'Remote Asynchronous',
  'Residential Course': 'Residential'
};

const CAMPUSES = {
  'Georgia Tech-Atlanta *': 'Atlanta',
  'GT Lorraine-Undergrad Programs': 'Lorraine Undergrad',
  'GT Lorraine-Graduate Programs': 'Lorraine Graduate',
  'Georgia Tech - Shenzhen': 'Shenzhen',
  Video: 'Video',
  Online: 'Online',
  'MBA Evening Program': 'MBA Evening'
};

const BACKEND_BASE_URL = 'https://gt-scheduler.azurewebsites.net';

export {
  OPEN,
  CLOSE,
  DAYS,
  PNG_SCALE_FACTOR,
  PALETTE,
  ASYNC_DELIVERY_MODE,
  DELIVERY_MODES,
  CAMPUSES,
  BACKEND_BASE_URL
};
