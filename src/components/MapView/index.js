import React from 'react';
import PropTypes from 'prop-types';
import GoogleMapReact from 'google-map-react';
import './stylesheet.scss';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const LocationPin = ({ text }) => (
  <div className="pin">
    <FontAwesomeIcon icon={faMapMarkerAlt} className="pin-icon" />
    <p className="pin-text">{text}</p>
  </div>
);

const MapView = ({ location, APIkey }) => (
  <div className="map">
    <h2 className="map-h2">Your class(es) is/are located here!</h2>

    <div className="google-map">
      <GoogleMapReact
        bootstrapURLKeys={{ key: APIkey }}
        defaultCenter={location}
        defaultZoom={16}
      >
        <LocationPin
          lat={location.lat}
          lng={location.lng}
          text={location.address}
        />
      </GoogleMapReact>
    </div>
  </div>
);

LocationPin.propTypes = {
  text: PropTypes.string
  // eslint-disable-next-line react/forbid-prop-types
};

LocationPin.defaultProps = {
  text: ''
};

MapView.propTypes = {
  location: PropTypes,
  APIkey: PropTypes.string
  // eslint-disable-next-line react/forbid-prop-types
};

MapView.defaultProps = {
  location: {},
  APIkey: ''
};

export default MapView;
