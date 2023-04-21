import React, { useContext, useState } from 'react';
import ReactMapGL, { Marker, NavigationControl, ViewState } from 'react-map-gl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapPin } from '@fortawesome/free-solid-svg-icons';

import { Location } from '../../types';
import { ThemeContext } from '../../contexts';

import 'mapbox-gl/dist/mapbox-gl.css';
import './stylesheet.scss';

export type MapLocation = {
  section: string;
  id: string;
  coords: Location | null;
};

export type MapViewProps = {
  locations: MapLocation[];
};

export default function MapView({
  locations,
}: MapViewProps): React.ReactElement {
  // These initial coordinates start the map looking at the GT Atlanta campus
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 33.7765,
    longitude: -84.3963,
    zoom: 15,
  });

  const unknown: MapLocation[] = [];
  const coordsToLocationsMap = new Map<Location, MapLocation[]>();
  locations.forEach((location) => {
    if (location.coords === null) {
      unknown.push(location);
    } else if (coordsToLocationsMap.has(location.coords)) {
      coordsToLocationsMap.get(location.coords)?.push(location);
    } else {
      coordsToLocationsMap.set(location.coords, [location]);
    }
  });

  // Switch the map style based on the current theme.
  // These are custom styles owned by the Mapbox account in the BitWarden.
  // Public share links:
  // Dark: https://api.mapbox.com/styles/v1/gt-scheduler/cktc4yzhm018w17ql65xa802o.html?fresh=true&title=copy&access_token=pk.eyJ1IjoiZ3Qtc2NoZWR1bGVyIiwiYSI6ImNrdGM0cXlqMDA0aXYyeHBma290Y2NyOTgifQ.S_A1gOu-FSQ8ywQFf2rr5A
  // Light: https://api.mapbox.com/styles/v1/gt-scheduler/cktc4y61t018918qjynvngozg.html?fresh=true&title=copy&access_token=pk.eyJ1IjoiZ3Qtc2NoZWR1bGVyIiwiYSI6ImNrdGM0cXlqMDA0aXYyeHBma290Y2NyOTgifQ.S_A1gOu-FSQ8ywQFf2rr5A
  const [theme] = useContext(ThemeContext);
  const mapStyle =
    theme === 'dark'
      ? 'mapbox://styles/gt-scheduler/cktc4yzhm018w17ql65xa802o' // gt-scheduler-dark
      : 'mapbox://styles/gt-scheduler/cktc4y61t018918qjynvngozg'; // gt-scheduler-light

  return (
    <div className="mapbox">
      <ReactMapGL
        height="100%"
        width="100%"
        viewState={viewState}
        mapStyle={mapStyle}
        mapboxApiAccessToken={process.env['REACT_APP_MAPBOX_TOKEN'] ?? ''}
        onViewStateChange={({
          viewState: newViewState,
        }: {
          viewState: ViewState;
        }): void => setViewState(newViewState)}
      >
        {Array.from(coordsToLocationsMap.entries()).map(
          ([coords, coordLocations], i) => (
            <Marker key={i} latitude={coords.lat} longitude={coords.long}>
              <FontAwesomeIcon icon={faMapPin} className="pin-icon" />
              <div className="pin-text">
                {coordLocations.map((coordLocation) => (
                  <div key={coordLocation.id + coordLocation.section}>
                    {coordLocation.id} {coordLocation.section}
                  </div>
                ))}
              </div>
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
