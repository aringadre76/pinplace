import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Pin } from '../../types';
import L from 'leaflet';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface PinMarkerProps {
  pin: Pin;
  canDelete?: boolean;
  onDelete?: (pinId: string) => void;
}

export const PinMarker: React.FC<PinMarkerProps> = ({ pin, canDelete = false, onDelete }) => {
  const handleDelete = () => {
    if (canDelete && onDelete) {
      if (confirm('Are you sure you want to delete this pin?')) {
        onDelete(pin.id);
      }
    }
  };

  const handleGetDirections = () => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <Marker 
      position={[pin.lat, pin.lng]} 
      icon={defaultIcon}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          <h3 className="font-semibold text-gray-900">{pin.name}</h3>
          {pin.description && (
            <p className="text-gray-600 mt-1 text-sm">{pin.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Added {pin.createdAt ? pin.createdAt.toDate().toLocaleDateString() : 'Recently'}
          </p>
          
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={handleGetDirections}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Get Directions
            </button>
            
            {canDelete && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Delete Pin
              </button>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};
