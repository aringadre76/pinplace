export interface Point {
  lat: number;
  lng: number;
}

export interface SpatialQuery {
  center: Point;
  radiusMiles: number;
}

export function calculateDistance(point1: Point, point2: Point): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.lng - point1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  return distanceKm * 0.621371; // Convert to miles
}

export function findPinsInRadius(pins: Array<{ lat: number; lng: number; [key: string]: any }>, query: SpatialQuery): Array<{ lat: number; lng: number; distance: number; [key: string]: any }> {
  return pins
    .map(pin => ({
      ...pin,
      distance: calculateDistance(query.center, { lat: pin.lat, lng: pin.lng })
    }))
    .filter(pin => pin.distance <= query.radiusMiles)
    .sort((a, b) => a.distance - b.distance);
}

export function getMapCenter(pins: Array<{ lat: number; lng: number }>): Point {
  if (pins.length === 0) {
    return { lat: 40.7128, lng: -74.0060 }; // Default to NYC
  }
  
  const avgLat = pins.reduce((sum, pin) => sum + pin.lat, 0) / pins.length;
  const avgLng = pins.reduce((sum, pin) => sum + pin.lng, 0) / pins.length;
  
  return { lat: avgLat, lng: avgLng };
}

export function getMapBounds(pins: Array<{ lat: number; lng: number }>): { north: number; south: number; east: number; west: number } {
  if (pins.length === 0) {
    return { north: 40.8, south: 40.6, east: -73.9, west: -74.1 }; // Default bounds around NYC
  }
  
  const lats = pins.map(pin => pin.lat);
  const lngs = pins.map(pin => pin.lng);
  
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
