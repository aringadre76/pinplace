export interface DirectionsResult {
  distance: number; // in kilometers
  duration: number; // in minutes
  route?: any; // full route data
}

export interface Point {
  lat: number;
  lng: number;
}

export class DirectionsService {
  private apiKey: string;
  private baseUrl = 'https://api.openrouteservice.org/v2/directions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  async getDrivingDirections(start: Point, end: Point): Promise<DirectionsResult | null> {
    if (!this.apiKey) {
      console.warn('No OpenRouteService API key provided. Using fallback calculation.');
      return this.getFallbackDirections(start, end);
    }

    try {
      const url = `${this.baseUrl}/driving-car/json`;
      const body = {
        coordinates: [[start.lng, start.lat], [end.lng, end.lat]],
        format: 'json',
        options: {
          avoid_features: ['highways'],
          profile_params: {
            weightings: {
              green: 0.1,
              quiet: 0.1
            }
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Directions API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const route = data.features[0];
        const properties = route.properties;
        
        return {
          distance: properties.summary.distance / 1000, // Convert meters to km
          duration: properties.summary.duration / 60, // Convert seconds to minutes
          route: route
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching directions:', error);
      return this.getFallbackDirections(start, end);
    }
  }

  private getFallbackDirections(start: Point, end: Point): DirectionsResult {
    // Fallback: Use Haversine distance and estimate driving time
    const distance = this.calculateHaversineDistance(start, end);
    
    // Estimate driving time based on average speed
    // Urban: 30 km/h, Highway: 80 km/h, Mixed: 50 km/h average
    const averageSpeed = 50; // km/h
    const duration = (distance / averageSpeed) * 60; // Convert to minutes
    
    return {
      distance,
      duration
    };
  }

  private calculateHaversineDistance(point1: Point, point2: Point): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLon = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
      }
    }
  }

  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} meters`;
    } else {
      return `${km.toFixed(1)} km`;
    }
  }
}

export const directionsService = new DirectionsService();
