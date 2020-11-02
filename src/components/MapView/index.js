import React from 'react';
import GoogleMapReact from 'google-map-react';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './stylesheet.scss';

const LocationPin = ({ text }) => (
  <div className="pin">
    <FontAwesomeIcon icon={faMapMarkerAlt} className="pin-icon" />
    <p className="pin-text">{text}</p>
  </div>
);

const MapView = ({ locations, APIkey }) => (
  <div className="google-map">
    <GoogleMapReact
      bootstrapURLKeys={{ key: APIkey }}
      defaultCenter={{ lat: 33.7756, lng: -84.3963 }}
      defaultZoom={16}
    >
      {locations.map((location, i) => (
        <LocationPin
          key={i}
          lat={location.lat}
          lng={location.lng}
          text={location.id}
        />
      ))}
    </GoogleMapReact>
  </div>
);

export default MapView;
