import { Location } from '../../types';

export interface MapBoxGeometry {
  type: string;
  coordinates: [number, number];
}

export interface MapBoxFeature {
  type: string;
  geometry: MapBoxGeometry;
  properties: Record<string, unknown>;
}

export interface MapBoxRetrieveResponse {
  type: string;
  features: MapBoxFeature[];
}

export interface MapBoxSuggestion {
  name: string;
  name_preferred?: string;
  mapbox_id: string;
  feature_type: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
  context?: {
    country?: {
      name: string;
      country_code: string;
      country_code_alpha_3: string;
    };
    region?: {
      name: string;
      region_code: string;
      region_code_full: string;
    };
    postcode?: {
      name: string;
    };
    district?: {
      name: string;
    };
    place?: {
      name: string;
    };
    locality?: {
      name: string;
    };
    neighborhood?: {
      name: string;
    };
    street?: {
      name: string;
    };
  };
  language?: string;
  maki?: string;
  poi_category?: string[];
  poi_category_ids?: string[];
  external_ids?: {
    foursquare?: string;
    facebook?: string;
  };
  metadata?: {
    primary_photo?: string[];
    other_photos?: string[];
  };
}

export interface MapBoxSearchBoxResponse {
  suggestions: MapBoxSuggestion[];
  attribution: string;
}

export type LocationKey = string;
export type DistanceMatrixEntry = number;

export interface GTLocation {
  name: string;
  address: string;
  coords: Location;
}
