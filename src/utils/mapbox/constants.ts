import { Location } from '../../types';

// Georgia Tech campus coordinates for proximity bias
export const GT_CAMPUS_CENTER = {
  longitude: -84.3963,
  latitude: 33.7756,
};

// Fallback GT locations - about 300 lines
export const FALLBACK_GT_LOCATIONS = [
  {
    name: 'Skiles',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.773568, long: -84.395957 },
  },
  {
    name: 'Clough Commons',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.774909, long: -84.396404 },
  },
  {
    name: 'Clough UG Learning Commons',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.774909, long: -84.396404 },
  },
  {
    name: 'Boggs',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776085, long: -84.400181 },
  },
  {
    name: 'Architecture (West)',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776076, long: -84.396114 },
  },
  {
    name: 'West Architecture',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776076, long: -84.396114 },
  },
  {
    name: 'Architecture (East)',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776177, long: -84.395459 },
  },
  {
    name: 'East Architecture',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776177, long: -84.395459 },
  },
  {
    name: 'Scheller College of Business',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776533, long: -84.387765 },
  },
  {
    name: 'Guggenheim Aerospace',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.771771, long: -84.395796 },
  },
  {
    name: 'Van Leer',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776065, long: -84.397116 },
  },
  {
    name: 'Bunger-Henry',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775803, long: -84.398189 },
  },
  {
    name: 'Coll of Computing',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777576, long: -84.397352 },
  },
  {
    name: 'College of Computing',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777576, long: -84.397352 },
  },
  {
    name: 'Weber SST III',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.772949, long: -84.396066 },
  },
  {
    name: 'Engr Science & Mech',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.772114, long: -84.395289 },
  },
  {
    name: 'Engineering Sci and Mechanics',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.772114, long: -84.395289 },
  },
  {
    name: 'Mason',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776764, long: -84.39844 },
  },
  {
    name: 'Love (MRDC II)',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77672, long: -84.401764 },
  },
  {
    name: 'J. Erskine Love Manufacturing',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77672, long: -84.401764 },
  },
  {
    name: 'MRDC',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777187, long: -84.400484 },
  },
  {
    name: 'Manufacture Rel Discip Complex',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777187, long: -84.400484 },
  },
  {
    name: 'Allen Sustainable Education',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77622, long: -84.397959 },
  },
  {
    name: 'Howey (Physics)',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777622, long: -84.398785 },
  },
  {
    name: 'Instr Center',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775587, long: -84.401213 },
  },
  {
    name: 'Instructional Center',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775587, long: -84.401213 },
  },
  {
    name: "O'Keefe",
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779177, long: -84.392196 },
  },
  {
    name: 'Curran Street Deck',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779495, long: -84.405633 },
  },
  {
    name: 'D. M. Smith',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.773801, long: -84.395122 },
  },
  {
    name: 'Swann',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.771658, long: -84.395302 },
  },
  {
    name: 'Kendeda',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.778759, long: -84.399597 },
  },
  {
    name: 'Ford Environmental Sci & Tech',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779004, long: -84.395849 },
  },
  {
    name: 'Klaus Advanced Computing Building',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777107, long: -84.395817 },
  },
  {
    name: 'Cherry Emerson',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.778011, long: -84.397065 },
  },
  {
    name: 'U A Whitaker Biomedical Engr',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.778513, long: -84.396825 },
  },
  {
    name: 'Whitaker',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.778513, long: -84.396825 },
  },
  {
    name: 'Molecular Sciences & Engr',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779836, long: -84.396666 },
  },
  {
    name: '760 Spring Street',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77561, long: -84.38906 },
  },
  {
    name: 'Paper Tricentennial',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.780983, long: -84.404516 },
  },
  {
    name: 'Daniel Lab',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.773714, long: -84.394047 },
  },
  {
    name: 'Pettit MiRC',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.776532, long: -84.397307 },
  },
  {
    name: 'Centergy',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.777062, long: -84.388997 },
  },
  {
    name: 'Stephen C Hall',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.774134, long: -84.39396 },
  },
  {
    name: 'Brittain T Room',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77247, long: -84.391271 },
  },
  {
    name: 'Hefner Dormitory(HEF)',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779159, long: -84.403952 },
  },
  {
    name: 'Old Civil Engr',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7742, long: -84.394637 },
  },
  {
    name: 'West Village Dining Commons',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.779564, long: -84.404718 },
  },
  {
    name: 'Couch',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.778233, long: -84.404507 },
  },
  {
    name: 'J. S. Coon',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77258, long: -84.395624 },
  },
  {
    name: '575 Fourteenth Street',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.786914, long: -84.406213 },
  },
  {
    name: 'Groseclose',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775778, long: -84.401885 },
  },
  {
    name: 'Theater for the Arts',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775041, long: -84.399287 },
  },
  {
    name: 'Habersham',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.773978, long: -84.404311 },
  },
  {
    name: 'Savant',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.772075, long: -84.395277 },
  },
  {
    name: 'ISyE Main',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775178, long: -84.401879 },
  },
  {
    name: 'Fourth Street Houses',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.775381, long: -84.391451 },
  },
  {
    name: 'Rich-Computer Center',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.77535159008218, long: -84.39513500282604 },
  },
  {
    name: 'Student Center',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7738, long: -84.397 },
  },
  {
    name: 'Campus Recreation Center',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7766, long: -84.4048 },
  },
  {
    name: 'Tech Tower',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7756, long: -84.3963 },
  },
  {
    name: 'McCamish Pavilion',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7805, long: -84.3921 },
  },
  {
    name: 'Bobby Dodd Stadium',
    address: 'Georgia Institute of Technology, Atlanta, GA',
    coords: { lat: 33.7723, long: -84.3922 },
  },
];

export interface GTLocation {
  name: string;
  address: string;
  coords: Location;
}
