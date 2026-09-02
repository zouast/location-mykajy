export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] — ordre GeoJSON RFC 7946
}

export interface GeoJsonPointProperties {
  id: string;
  title?: string;
  city: string;
  neighborhood?: string;
  zipCode?: string;
}

export interface GeoJsonFeature<T = Record<string, unknown>> {
  type: 'Feature';
  geometry: GeoPoint;
  properties: T;
}

export interface GeoJsonFeatureCollection<T = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJsonFeature<T>[];
}
