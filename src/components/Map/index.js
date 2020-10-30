import React from 'react';
import MapView from '../MapView';

// TODO get the actual location/locations (if multiple)

const location = {
  address: 'Georgian Tech',
  lat: 33.7722,
  lng: -84.3902
};

const Map = () => {
  return <MapView location={location} />;
};

export default Map;
