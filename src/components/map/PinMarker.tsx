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

  return (
    <Marker 
      position={[pin.lat, pin.lng]} 
      icon={defaultIcon}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-semibold text-gray-900">{pin.name}</h3>
          {pin.description && (
            <p className="text-gray-600 mt-1">{pin.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Added {pin.createdAt ? pin.createdAt.toDate().toLocaleDateString() : 'Recently'}
          </p>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="mt-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Delete Pin
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
};
