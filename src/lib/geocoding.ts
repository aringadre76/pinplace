export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  place_id?: string;
}

export class GeocodingService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    // First try Nominatim (OpenStreetMap) - free, no API key needed
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'PinPlace-Map-App' // Nominatim requires a User-Agent
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            formatted_address: result.display_name,
            place_id: result.place_id
          };
        }
      }
    } catch (error) {
      console.warn('Nominatim geocoding failed, trying fallback methods:', error);
    }

    // Fallback: Try to extract zip code from address
    const zipCodeMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
    if (zipCodeMatch) {
      const zipCode = zipCodeMatch[1];
      const zipResult = await this.geocodeZipCode(zipCode);
      if (zipResult) {
        // Update formatted address to include original address info if it had street details
        if (this.isValidAddress(address)) {
          zipResult.formatted_address = `${address}`;
        }
        return zipResult;
      }
    }

    // Try Google Maps if API key is provided
    if (this.apiKey) {
      try {
        const url = `${this.baseUrl}?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
              formatted_address: result.formatted_address,
              place_id: result.place_id
            };
          }
        }
      } catch (error) {
        console.warn('Google Maps geocoding failed:', error);
      }
    }

    // Final fallback: use hardcoded locations
    return this.getFallbackCoordinates(address);
  }

  private getFallbackCoordinates(address: string): GeocodeResult | null {
    // Fallback coordinates for common locations and sports stadiums
    const fallbackLocations: { [key: string]: GeocodeResult } = {
      'carlsbad ca': { lat: 33.1581, lng: -117.3506, formatted_address: 'Carlsbad, CA, USA' },
      'carlsbad california': { lat: 33.1581, lng: -117.3506, formatted_address: 'Carlsbad, CA, USA' },
      'san diego ca': { lat: 32.7157, lng: -117.1611, formatted_address: 'San Diego, CA, USA' },
      'los angeles ca': { lat: 34.0522, lng: -118.2437, formatted_address: 'Los Angeles, CA, USA' },
      'san francisco ca': { lat: 37.7749, lng: -122.4194, formatted_address: 'San Francisco, CA, USA' },
      'new york ny': { lat: 40.7128, lng: -74.0060, formatted_address: 'New York, NY, USA' },
      'chicago il': { lat: 41.8781, lng: -87.6298, formatted_address: 'Chicago, IL, USA' },
      'miami fl': { lat: 25.7617, lng: -80.1918, formatted_address: 'Miami, FL, USA' },
      'seattle wa': { lat: 47.6062, lng: -122.3321, formatted_address: 'Seattle, WA, USA' },
      'boston ma': { lat: 42.3601, lng: -71.0589, formatted_address: 'Boston, MA, USA' },
      'denver co': { lat: 39.7392, lng: -104.9903, formatted_address: 'Denver, CO, USA' },
      'austin tx': { lat: 30.2672, lng: -97.7431, formatted_address: 'Austin, TX, USA' },
      'phoenix az': { lat: 33.4484, lng: -112.0740, formatted_address: 'Phoenix, AZ, USA' },
      'las vegas nv': { lat: 36.1699, lng: -115.1398, formatted_address: 'Las Vegas, NV, USA' },
      'portland or': { lat: 45.5152, lng: -122.6784, formatted_address: 'Portland, OR, USA' },
      'atlanta ga': { lat: 33.7490, lng: -84.3880, formatted_address: 'Atlanta, GA, USA' },
      'dallas tx': { lat: 32.7767, lng: -96.7970, formatted_address: 'Dallas, TX, USA' },
      'houston tx': { lat: 29.7604, lng: -95.3698, formatted_address: 'Houston, TX, USA' },
      'philadelphia pa': { lat: 39.9526, lng: -75.1652, formatted_address: 'Philadelphia, PA, USA' },
      'detroit mi': { lat: 42.3314, lng: -83.0458, formatted_address: 'Detroit, MI, USA' },
      'santa clara ca': { lat: 37.3541, lng: -121.9552, formatted_address: 'Santa Clara, CA, USA' },
      
      '49ers stadium': { lat: 37.4029, lng: -121.9697, formatted_address: "Levi's Stadium, Santa Clara, CA" },
      'levis stadium': { lat: 37.4029, lng: -121.9697, formatted_address: "Levi's Stadium, Santa Clara, CA" },
      "levi's stadium": { lat: 37.4029, lng: -121.9697, formatted_address: "Levi's Stadium, Santa Clara, CA" },
      'dodger stadium': { lat: 34.0739, lng: -118.2400, formatted_address: 'Dodger Stadium, Los Angeles, CA' },
      'yankee stadium': { lat: 40.8296, lng: -73.9262, formatted_address: 'Yankee Stadium, Bronx, NY' },
      'fenway park': { lat: 42.3467, lng: -71.0972, formatted_address: 'Fenway Park, Boston, MA' },
      'wrigley field': { lat: 41.9484, lng: -87.6553, formatted_address: 'Wrigley Field, Chicago, IL' },
      'oracle park': { lat: 37.7786, lng: -122.3893, formatted_address: 'Oracle Park, San Francisco, CA' },
      'petco park': { lat: 32.7073, lng: -117.1566, formatted_address: 'Petco Park, San Diego, CA' },
      'sofi stadium': { lat: 33.9535, lng: -118.3392, formatted_address: 'SoFi Stadium, Inglewood, CA' },
      'staples center': { lat: 34.0430, lng: -118.2673, formatted_address: 'Crypto.com Arena, Los Angeles, CA' },
      'crypto.com arena': { lat: 34.0430, lng: -118.2673, formatted_address: 'Crypto.com Arena, Los Angeles, CA' },
      'madison square garden': { lat: 40.7505, lng: -73.9934, formatted_address: 'Madison Square Garden, New York, NY' },
      'msg': { lat: 40.7505, lng: -73.9934, formatted_address: 'Madison Square Garden, New York, NY' },
      'lambeau field': { lat: 44.5013, lng: -88.0622, formatted_address: 'Lambeau Field, Green Bay, WI' },
      'arrowhead stadium': { lat: 39.0489, lng: -94.4839, formatted_address: 'Arrowhead Stadium, Kansas City, MO' },
      'metlife stadium': { lat: 40.8128, lng: -74.0742, formatted_address: 'MetLife Stadium, East Rutherford, NJ' },
      'att stadium': { lat: 32.7473, lng: -97.0945, formatted_address: 'AT&T Stadium, Arlington, TX' }
    };

    const normalizedAddress = address.toLowerCase().trim();
    
    // Try exact match first
    if (fallbackLocations[normalizedAddress]) {
      return fallbackLocations[normalizedAddress];
    }

    // Try partial matches
    for (const [key, value] of Object.entries(fallbackLocations)) {
      if (normalizedAddress.includes(key) || key.includes(normalizedAddress)) {
        return value;
      }
    }

    return null;
  }

  async geocodeZipCode(zipCode: string): Promise<GeocodeResult | null> {
    try {
      // Use Zippopotam.us API for US zip codes (free, no API key needed)
      const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      
      if (!response.ok) {
        console.warn(`Zip code ${zipCode} not found in Zippopotam API, using fallback`);
        return this.getFallbackZipCode(zipCode);
      }

      const data = await response.json();
      
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        const lat = parseFloat(place.latitude);
        const lng = parseFloat(place.longitude);
        const city = place['place name'];
        const state = place['state abbreviation'];
        
        return {
          lat,
          lng,
          formatted_address: `${city}, ${state} ${zipCode}, USA`
        };
      }

      return this.getFallbackZipCode(zipCode);
    } catch (error) {
      console.error('Error geocoding zip code:', error);
      return this.getFallbackZipCode(zipCode);
    }
  }

  private getFallbackZipCode(zipCode: string): GeocodeResult | null {
    // Fallback for common zip codes
    const fallbackZipCodes: { [key: string]: GeocodeResult } = {
      '92008': { lat: 33.1581, lng: -117.3506, formatted_address: 'Carlsbad, CA 92008, USA' },
      '92009': { lat: 33.1581, lng: -117.3506, formatted_address: 'Carlsbad, CA 92009, USA' },
      '92101': { lat: 32.7157, lng: -117.1611, formatted_address: 'San Diego, CA 92101, USA' },
      '90210': { lat: 34.0901, lng: -118.4065, formatted_address: 'Beverly Hills, CA 90210, USA' },
      '10001': { lat: 40.7505, lng: -73.9934, formatted_address: 'New York, NY 10001, USA' },
      '60601': { lat: 41.8781, lng: -87.6298, formatted_address: 'Chicago, IL 60601, USA' },
      '33101': { lat: 25.7617, lng: -80.1918, formatted_address: 'Miami, FL 33101, USA' },
      '98101': { lat: 47.6062, lng: -122.3321, formatted_address: 'Seattle, WA 98101, USA' },
      '02101': { lat: 42.3601, lng: -71.0589, formatted_address: 'Boston, MA 02101, USA' }
    };

    return fallbackZipCodes[zipCode] || null;
  }

  isValidZipCode(zipCode: string): boolean {
    // US ZIP code pattern: 5 digits or 5+4 format
    const zipPattern = /^\d{5}(-\d{4})?$/;
    return zipPattern.test(zipCode);
  }

  isValidAddress(address: string): boolean {
    // Basic address validation - should contain numbers and street name
    const addressPattern = /^\d+\s+[a-zA-Z\s]+/;
    return addressPattern.test(address);
  }
}

export const geocodingService = new GeocodingService();
