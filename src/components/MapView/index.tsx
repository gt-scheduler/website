import React, { useContext, useState, useEffect, useMemo } from 'react';
import ReactMapGL, {
  Layer,
  LayerProps,
  Marker,
  NavigationControl,
  Source,
  ViewState,
} from 'react-map-gl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapPin } from '@fortawesome/free-solid-svg-icons';

import { Location } from '../../types';
import { ThemeContext } from '../../contexts';
import { ScheduleBlockEventType } from '../DaySelection';
import {
  batchGetDistances,
  createLocationKey,
} from '../../utils/mapbox/travelTimes';

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
  showTravelTimes?: boolean;
};

function getDisplayText(location: MapLocation): string {
  return location.type === ScheduleBlockEventType.CustomEvent
    ? location.title
    : [location.id, location.section].filter(Boolean).join(' ');
}

export default function MapView({
  locations,
  showTravelTimes = false,
}: MapViewProps): React.ReactElement {
  // These initial coordinates start the map looking at the GT Atlanta campus
  // We maintain focus on GT campus even when events are far away
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 33.7765,
    longitude: -84.3963,
    zoom: 15,
  });

  const [travelTimes, setTravelTimes] = useState<Map<string, number> | null>(
    null
  );

  // Use useMemo to avoid recalculating when locations array reference changes
  const validLocations = useMemo(() => {
    return locations
      .filter(
        (location): location is MapLocation & { coords: Location } =>
          location.coords !== null
      )
      .map((location) => location.coords);
  }, [locations]);

  useEffect(() => {
    const calculateTravelTimes = async (): Promise<void> => {
      if (!showTravelTimes || validLocations.length < 2) {
        setTravelTimes(null);
        return;
      }

      try {
        const travelTimesResult = await batchGetDistances(validLocations);
        setTravelTimes(travelTimesResult);
      } catch (error) {
        setTravelTimes(null);
      }
    };

    calculateTravelTimes().catch(() => {
      setTravelTimes(null);
    });
  }, [validLocations, showTravelTimes]);

  type TravelSegment = {
    id: string;
    from: Location;
    to: Location;
    midpoint: Location;
    duration: number | null;
  };

  const travelSegments = useMemo<TravelSegment[]>(() => {
    if (!showTravelTimes || validLocations.length < 2) return [];

    const segments: TravelSegment[] = [];
    for (let i = 0; i < validLocations.length - 1; i += 1) {
      const start = validLocations[i];
      const end = validLocations[i + 1];
      if (start != null && end != null) {
        const key = createLocationKey(start, end);
        const duration = travelTimes?.get(key) ?? null;

        segments.push({
          id: key,
          from: start,
          to: end,
          midpoint: {
            lat: (start.lat + end.lat) / 2,
            long: (start.long + end.long) / 2,
          },
          duration,
        });
      }
    }

    return segments;
  }, [showTravelTimes, validLocations, travelTimes]);

  const segmentsWithDuration = useMemo(
    () =>
      travelSegments.filter(
        (segment): segment is TravelSegment & { duration: number } =>
          segment.duration !== null
      ),
    [travelSegments]
  );

  const travelLineGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: segmentsWithDuration.map((segment, index) => ({
        type: 'Feature' as const,
        id: `travel-line-${segment.id}-${index}`,
        properties: {
          duration: segment.duration,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [segment.from.long, segment.from.lat],
            [segment.to.long, segment.to.lat],
          ],
        },
      })),
    }),
    [segmentsWithDuration]
  );

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
  const travelLineLayerStyle = useMemo<LayerProps>(() => {
    const techGold = '#B3A369';
    return {
      id: 'travel-lines',
      type: 'line',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-width': 4.5,
        'line-color': techGold,
        'line-opacity': 1,
      },
    };
  }, []);

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

  const formatTravelDuration = (durationInSeconds: number): string => {
    if (durationInSeconds < 60) {
      return '< 1 min';
    }
    const minutes = Math.round(durationInSeconds / 60);
    return `${minutes} min`;
  };

  const shouldShowTravelLines =
    showTravelTimes && segmentsWithDuration.length > 0;

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
        {shouldShowTravelLines && (
          <Source
            id="travel-lines-source"
            type="geojson"
            data={travelLineGeoJson}
          >
            <Layer {...travelLineLayerStyle} />
          </Source>
        )}
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
        {shouldShowTravelLines &&
          segmentsWithDuration.map((segment) => (
            <Marker
              key={`travel-label-${segment.id}`}
              latitude={segment.midpoint.lat}
              longitude={segment.midpoint.long}
            >
              <div className="travel-label">
                <span aria-hidden="true" className="travel-label__icon">
                  🚶
                </span>
                {formatTravelDuration(segment.duration)}
              </div>
            </Marker>
          ))}
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
