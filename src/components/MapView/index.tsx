import React, { useContext, useState } from 'react';
import ReactMapGL, { Marker, NavigationControl, ViewState } from 'react-map-gl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapPin } from '@fortawesome/free-solid-svg-icons';

import { Location } from '../../types';
import { ThemeContext } from '../../contexts';
import { ScheduleBlockEventType } from '../DaySelection';

import 'mapbox-gl/dist/mapbox-gl.css';
import './stylesheet.scss';

export type MapLocation = {
  id: string;
  title: string;
  coords: Location | null;
  section?: string;
  type: ScheduleBlockEventType;
};

export type MapViewProps = {
  locations: MapLocation[];
};

function getDisplayText(location: MapLocation): string {
  return location.type === ScheduleBlockEventType.CustomEvent
    ? location.title
    : [location.id, location.section].filter(Boolean).join(' ');
}

export default function MapView({
  locations,
}: MapViewProps): React.ReactElement {
  // These initial coordinates start the map looking at the GT Atlanta campus
  // We maintain focus on GT campus even when events are far away
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 33.7765,
    longitude: -84.3963,
    zoom: 15,
  });

  const unknown: MapLocation[] = [];
  // Use string keys (lat,long) instead of Location objects for proper grouping
  const coordsToLocationsMap = new Map<
    string,
    { coords: Location; locations: MapLocation[] }
  >();

  locations.forEach((location) => {
    if (location.coords === null) {
      unknown.push(location);
    } else {
      const coordKey = `${location.coords.lat},${location.coords.long}`;
      const existing = coordsToLocationsMap.get(coordKey);
      if (existing) {
        existing.locations.push(location);
      } else {
        coordsToLocationsMap.set(coordKey, {
          coords: location.coords,
          locations: [location],
        });
      }
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

  // Get the MapBox token and provide helpful error if missing
  const mapboxToken = process.env['REACT_APP_MAPBOX_TOKEN'] ?? '';
  if (!mapboxToken) {
    // MapBox token is missing - this will be logged in development
    return (
      <div className="mapbox error-message">
        <p>Map cannot load: Missing MapBox API token</p>
        <p>Please check that REACT_APP_MAPBOX_TOKEN is set in your .env file</p>
      </div>
    );
  }

  return (
    <div className="mapbox">
      <ReactMapGL
        height="100%"
        width="100%"
        viewState={viewState}
        mapStyle={mapStyle}
        mapboxApiAccessToken={mapboxToken}
        onViewStateChange={({
          viewState: newViewState,
        }: {
          viewState: ViewState;
        }): void => setViewState(newViewState)}
      >
        {Array.from(coordsToLocationsMap.values()).map(
          ({ coords, locations: coordLocations }, i) => (
            <Marker key={i} latitude={coords.lat} longitude={coords.long}>
              <FontAwesomeIcon icon={faMapPin} className="pin-icon" />
              <div className="pin-text">
                {coordLocations.map((location) => (
                  <div key={`${location.id}-${location.title}`}>
                    {getDisplayText(location)}
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
                {getDisplayText(location)}
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
