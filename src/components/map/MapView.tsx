import React, { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { Pin } from '../../types';
import { PinMarker } from './PinMarker';
import { AddPinControl } from './AddPinControl';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  mapId: string;
  pins: Pin[];
  onAddPin: (pin: { lat: number; lng: number; name: string; description?: string }) => Promise<void>;
  onDeletePin?: (pinId: string) => Promise<void>;
  isLocked: boolean;
  canDeletePins?: boolean;
  center?: [number, number];
  zoom?: number;
}

const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ 
  pins, 
  onAddPin, 
  onDeletePin,
  isLocked, 
  canDeletePins = false,
  center = [40.7128, -74.0060], 
  zoom = 13 
}) => {
  const [showAddPinForm, setShowAddPinForm] = useState(false);
  const [clickedPosition, setClickedPosition] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    if (!isLocked) {
      setClickedPosition({ lat, lng });
      setShowAddPinForm(true);
    }
  };

  const handleAddPin = async (pinData: { name: string; description?: string }) => {
    if (clickedPosition) {
      await onAddPin({
        ...clickedPosition,
        ...pinData
      });
      setShowAddPinForm(false);
      setClickedPosition(null);
    }
  };

  const handleDeletePin = async (pinId: string) => {
    if (onDeletePin) {
      await onDeletePin(pinId);
    }
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onMapClick={handleMapClick} />
        
        {pins.map((pin) => (
          <PinMarker 
            key={pin.id} 
            pin={pin} 
            canDelete={canDeletePins}
            onDelete={handleDeletePin}
          />
        ))}
      </MapContainer>

      {showAddPinForm && clickedPosition && (
        <AddPinControl
          position={clickedPosition}
          onSubmit={handleAddPin}
          onCancel={() => {
            setShowAddPinForm(false);
            setClickedPosition(null);
          }}
        />
      )}

      {isLocked && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg shadow-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Map is locked - no new pins can be added
          </div>
        </div>
      )}
    </div>
  );
};
