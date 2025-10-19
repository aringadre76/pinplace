import { Pin } from '../types';
import { calculateDistance, findPinsInRadius, Point } from './spatial';
import { directionsService } from './directions';
import { geocodingService } from './geocoding';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MapQueryContext {
  pins: Pin[];
  mapCenter: Point;
  mapBounds: { north: number; south: number; east: number; west: number };
  mapName: string;
  isLocked: boolean;
  isMapCreator: boolean;
}

export interface ChatbotResponse {
  message: string;
  data?: any;
  action?: 'move_map' | 'highlight_pins' | 'show_info' | 'add_pin' | 'delete_all_pins';
}

interface LLMIntent {
  action: 'geocode' | 'calculate_distance' | 'find_radius' | 'driving_time' | 'delete_all_pins' | 'chat';
  parameters?: {
    location?: string;
    pin1?: string;
    pin2?: string;
    center_lat?: number;
    center_lng?: number;
    radius?: number;
  };
  response_text?: string;
}

class ChatbotService {
  private baseUrl = 'http://localhost:11434';

  async sendMessage(message: string, context: MapQueryContext): Promise<ChatbotResponse> {
    const systemPrompt = this.buildSystemPrompt(context);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2:3b',
          prompt: `${systemPrompt}\n\nUser: ${message}\n\nAnalyze this request and respond with a JSON object indicating your intent. Format:\n{\n  "action": "geocode" | "calculate_distance" | "find_radius" | "driving_time" | "chat",\n  "parameters": {...},\n  "response_text": "conversational response to user"\n}\n\nAssistant:`,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.3,
            top_p: 0.9,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const intent: LLMIntent = JSON.parse(data.response);
      
      return await this.executeIntent(intent, context);
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      return {
        message: "I'm having trouble connecting to the AI service. Please try again later.",
      };
    }
  }

  private async executeIntent(intent: LLMIntent, context: MapQueryContext): Promise<ChatbotResponse> {
    switch (intent.action) {
      case 'geocode':
        if (intent.parameters?.location) {
          return await this.executeGeocode(intent.parameters.location, context, intent.response_text);
        }
        break;
      
      case 'calculate_distance':
        if (intent.parameters?.pin1 && intent.parameters?.pin2) {
          return this.executeCalculateDistance(intent.parameters.pin1, intent.parameters.pin2, context);
        }
        break;
      
      case 'find_radius':
        if (intent.parameters?.center_lat && intent.parameters?.center_lng && intent.parameters?.radius) {
          return this.executeFindPinsInRadius(
            intent.parameters.center_lat,
            intent.parameters.center_lng,
            intent.parameters.radius,
            context
          );
        }
        break;
      
      case 'driving_time':
        if (intent.parameters?.pin1 && intent.parameters?.pin2) {
          return await this.executeGetDrivingTime(intent.parameters.pin1, intent.parameters.pin2, context);
        }
        break;
      
      case 'delete_all_pins':
        return this.executeDeleteAllPins(context, intent.response_text);
      
      case 'chat':
      default:
        return {
          message: intent.response_text || "I'm not sure how to help with that.",
        };
    }

    return {
      message: intent.response_text || "I'm not sure how to help with that.",
    };
  }

  private executeDeleteAllPins(context: MapQueryContext, responseText?: string): ChatbotResponse {
    if (!context.isMapCreator) {
      return {
        message: "Sorry, only the map creator can delete all pins.",
      };
    }

    if (context.pins.length === 0) {
      return {
        message: "There are no pins to delete on this map.",
      };
    }

    return {
      message: responseText || `Deleting all ${context.pins.length} pins from the map...`,
      action: 'delete_all_pins'
    };
  }

  private async executeGeocode(location: string, context: MapQueryContext, responseText?: string): Promise<ChatbotResponse> {
    if (context.isLocked) {
      return {
        message: "Sorry, this map is locked and no new pins can be added. You can only view and analyze existing pins.",
      };
    }

    try {
      const isZipCode = /^\d{5}(-\d{4})?$/.test(location);
      
      let geocodeResult;
      if (isZipCode) {
        geocodeResult = await geocodingService.geocodeZipCode(location);
      } else {
        geocodeResult = await geocodingService.geocodeAddress(location);
      }

      if (geocodeResult) {
        return {
          message: responseText || `Adding pin for ${location} at ${geocodeResult.formatted_address} (${geocodeResult.lat.toFixed(4)}, ${geocodeResult.lng.toFixed(4)}).`,
          data: {
            lat: geocodeResult.lat,
            lng: geocodeResult.lng,
            name: location,
            description: `Added by chatbot at ${new Date().toLocaleString()} - ${geocodeResult.formatted_address}`
          },
          action: 'add_pin'
        };
      } else {
        return {
          message: `I couldn't find the location "${location}". Please try a different location or provide coordinates directly.`,
        };
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      return {
        message: `I encountered an error while looking up "${location}". Please try again.`,
      };
    }
  }

  private executeCalculateDistance(pin1Name: string, pin2Name: string, context: MapQueryContext): ChatbotResponse {
    const pin1 = context.pins.find(p => p.name.toLowerCase().includes(pin1Name.toLowerCase()));
    const pin2 = context.pins.find(p => p.name.toLowerCase().includes(pin2Name.toLowerCase()));

    if (!pin1 || !pin2) {
      return {
        message: `I couldn't find one or both of the pins. Available pins: ${context.pins.map(p => p.name).join(', ')}`,
      };
    }

    const distance = calculateDistance(
      { lat: pin1.lat, lng: pin1.lng },
      { lat: pin2.lat, lng: pin2.lng }
    );

    return {
      message: `The distance between ${pin1.name} and ${pin2.name} is ${distance.toFixed(2)} miles.`,
      data: { pin1, pin2, distance }
    };
  }

  private executeFindPinsInRadius(centerLat: number, centerLng: number, radiusMiles: number, context: MapQueryContext): ChatbotResponse {
    const pinsInRadius = findPinsInRadius(context.pins, {
      center: { lat: centerLat, lng: centerLng },
      radiusMiles
    });

    if (pinsInRadius.length === 0) {
      return {
        message: `No pins found within ${radiusMiles} miles of the specified location.`,
      };
    }

    const pinList = pinsInRadius
      .map(pin => `${pin.name} (${pin.distance.toFixed(2)} miles away)`)
      .join('\n- ');

    return {
      message: `Found ${pinsInRadius.length} pin(s) within ${radiusMiles} miles:\n- ${pinList}`,
      data: pinsInRadius,
      action: 'highlight_pins'
    };
  }

  private async executeGetDrivingTime(startPinName: string, endPinName: string, context: MapQueryContext): Promise<ChatbotResponse> {
    const startPin = context.pins.find(p => p.name.toLowerCase().includes(startPinName.toLowerCase()));
    const endPin = context.pins.find(p => p.name.toLowerCase().includes(endPinName.toLowerCase()));

    if (!startPin || !endPin) {
      return {
        message: `I couldn't find one or both of the pins. Available pins: ${context.pins.map(p => p.name).join(', ')}`,
      };
    }

    try {
      const directions = await directionsService.getDrivingDirections(
        { lat: startPin.lat, lng: startPin.lng },
        { lat: endPin.lat, lng: endPin.lng }
      );

      if (directions) {
        const distance = directionsService.formatDistance(directions.distance);
        const duration = directionsService.formatDuration(directions.duration);

        return {
          message: `Driving from ${startPin.name} to ${endPin.name} would take approximately ${duration} and cover ${distance}.`,
          data: {
            startPin,
            endPin,
            distance: directions.distance,
            duration: directions.duration,
            directions
          }
        };
      } else {
        return {
          message: `I couldn't calculate the driving route from ${startPin.name} to ${endPin.name}.`,
        };
      }
    } catch (error) {
      console.error('Error calculating driving time:', error);
      return {
        message: `I encountered an error while calculating the driving time. Please try again.`,
      };
    }
  }

  private buildSystemPrompt(context: MapQueryContext): string {
    return `You are an intelligent map assistant for PinPlace. Analyze user requests and determine the appropriate action.

Map: "${context.mapName}"
Pins: ${context.pins.length} (${context.pins.slice(0, 5).map(p => p.name).join(', ')}${context.pins.length > 5 ? '...' : ''})
Map Status: ${context.isLocked ? 'LOCKED' : 'OPEN'}
User Role: ${context.isMapCreator ? 'MAP CREATOR' : 'VIEWER'}

Actions you can take:
1. "geocode" - Add pins by geocoding locations (zip codes, addresses, cities). Set parameters: {location: "..."}
2. "calculate_distance" - Calculate distance between pins. Set parameters: {pin1: "...", pin2: "..."}
3. "find_radius" - Find pins in radius. Set parameters: {center_lat: ..., center_lng: ..., radius: ...}
4. "driving_time" - Calculate driving time. Set parameters: {pin1: "...", pin2: "..."}
5. "delete_all_pins" - Delete all pins from the map (ONLY if user is MAP CREATOR)
6. "chat" - Just chat with the user

Examples:
User: "add 92008"
Response: {"action": "geocode", "parameters": {"location": "92008"}, "response_text": "Adding zip code 92008..."}

User: "distance between Pin A and Pin B"
Response: {"action": "calculate_distance", "parameters": {"pin1": "Pin A", "pin2": "Pin B"}, "response_text": "Calculating distance..."}

User: "delete all pins"
Response: {"action": "delete_all_pins", "response_text": "Deleting all pins from the map..."}

User: "hello"
Response: {"action": "chat", "response_text": "Hello! I can help you with map operations. Try asking me to add a location or calculate distances!"}

Be intelligent and conversational. Always include response_text.`;
  }
}

export const chatbotService = new ChatbotService();
