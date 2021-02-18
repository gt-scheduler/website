import React, { useState } from 'react';
import ReactMapGL, { Marker, NavigationControl } from 'react-map-gl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapPin } from '@fortawesome/free-solid-svg-icons';
import './stylesheet.scss';

const MapView = ({ locations }) => {
  const [viewport, setViewport] = useState({
    latitude: 33.7765,
    longitude: -84.3963,
    height: '100%',
    width: '100%',
    zoom: 15
  });

  const unknown = [];
  locations.forEach((location) => {
    if (!location.coords) unknown.push(location);
  });

  return (
    <div className="mapbox">
      <ReactMapGL
        {...viewport}
        showZoom
        showCompass
        mapStyle="mapbox://styles/mapbox/outdoors-v9"
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        onViewportChange={(display) => setViewport(display)}
      >
        {locations.map((location, i) =>
          !location.coords ? (
            <React.Fragment key={i} />
          ) : (
            <Marker
              key={i}
              latitude={location.coords.lat}
              longitude={location.coords.long}
            >
              <FontAwesomeIcon icon={faMapPin} className="pin-icon" />
              <p className="pin-text">
                {location.id} {location.section}
              </p>
            </Marker>
          )
        )}
        {unknown.length > 0 && (
          <div className="unknown-container">
            <b>Undetermined</b>
            {unknown.map((location, i) => (
              <div className="class" key={i}>
                {location.id} {location.section}
              </div>
            ))}
          </div>
        )}
        <div className="navigation">
          <NavigationControl />
        </div>
      </ReactMapGL>
    </div>
  );
};

export default MapView;
