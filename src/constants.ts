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

const CREDIT_HOURS_CLASS_TIME = {
  'Credit Hours': {
    type: 'list',
    property: 'credits',
    0: '0.0',
    1: '1.0',
    2: '2.0',
    3: '3.0',
    4: '4.0+'
  },
  Days: {
    type: 'list',
    property: 'days',
    M: 'Mon',
    T: 'Tues',
    W: 'Wed',
    R: 'Thu',
    F: 'Fri'
  },
  'Starts After': {
    type: 'dropdown',
    property: 'startsAfter',
    'Any time': 'Any time',
    480: '8:00 am',
    540: '9:00 am',
    600: '10:00 am',
    660: '11:00 am',
    720: '12:00 pm',
    780: '1:00 pm',
    840: '2:00 pm',
    900: '3:00 pm',
    960: '4:00 pm',
    1020: '5:00 pm',
    1080: '6:00 pm',
    1140: '7:00 pm',
    1200: '8:00 pm',
    1260: '9:00 pm'
  },
  'Ends Before': {
    type: 'dropdown',
    property: 'endsBefore',
    'Any time': 'Any time',
    480: '8:00 am',
    540: '9:00 am',
    600: '10:00 am',
    660: '11:00 am',
    720: '12:00 pm',
    780: '1:00 pm',
    840: '2:00 pm',
    900: '3:00 pm',
    960: '4:00 pm',
    1020: '5:00 pm',
    1080: '6:00 pm',
    1140: '7:00 pm',
    1200: '8:00 pm',
    1260: '9:00 pm'
  },
  'Course Level': {
    type: 'list',
    property: 'courseLevel',
    Undergraduate: 'Undergraduate',
    Graduate: 'Graduate'
  }
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
  CREDIT_HOURS_CLASS_TIME,
  BACKEND_BASE_URL
};
