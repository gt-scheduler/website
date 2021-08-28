import React, { useState } from 'react';
import ReactMapGL, { Marker, NavigationControl } from 'react-map-gl';
import { ViewState } from 'react-map-gl/src/mapbox/mapbox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapPin } from '@fortawesome/free-solid-svg-icons';
import { Location } from '../../types';
import './stylesheet.scss';

export type MapLocation = {
  section: string;
  id: string;
  title: string;
  days: string[];
  time: string;
  coords: Location | null;
};

export type MapViewProps = {
  locations: MapLocation[];
};

export default function MapView({
  locations
}: MapViewProps): React.ReactElement {
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 33.7765,
    longitude: -84.3963,
    zoom: 15
  });

  const unknown: MapLocation[] = [];
  locations.forEach((location) => {
    if (location.coords === null) unknown.push(location);
  });

  return (
    <div className="mapbox">
      <ReactMapGL
        height="100%"
        width="100%"
        viewState={viewState}
        mapStyle="mapbox://styles/mapbox/outdoors-v9"
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        onViewStateChange={(newViewState: ViewState): void =>
          setViewState(newViewState)
        }
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
          <NavigationControl showZoom showCompass />
        </div>
      </ReactMapGL>
    </div>
  );
}
