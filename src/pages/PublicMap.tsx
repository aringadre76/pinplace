import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapView, MapViewRef } from '../components/map/MapView';
import { CitySearchBar } from '../components/map/CitySearchBar';
// import { Chatbot } from '../components/chatbot/Chatbot';
import { useMapData, useShareLink } from '../hooks/useMapData';
import { useMapPins } from '../hooks/useMapPins';
import { useAddPin } from '../hooks/useAddPin';
import { useDeletePin } from '../hooks/useDeletePin';
import { useDeleteAllPins } from '../hooks/useDeleteAllPins';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/ToastProvider';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getMapCenter } from '../lib/spatial';

export const PublicMap: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const mapRef = useRef<MapViewRef>(null);
  
  const { map, loading: mapLoading, error: mapError } = useMapData(mapId || '');
  const { pins } = useMapPins(mapId || '');
  const { addPin } = useAddPin(mapId || '');
  const { deletePin } = useDeletePin(mapId || '');
  const { deleteAllPins } = useDeleteAllPins(mapId || '');
  const { generateShareLink, loading: linkLoading } = useShareLink(mapId || '');
  
  const [shareLink, setShareLink] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  // const [highlightedPins, setHighlightedPins] = useState<string[]>([]);

  useEffect(() => {
    if (mapId) {
      setShareLink(`${window.location.origin}/map/${mapId}`);
    }
  }, [mapId]);

  const handleGenerateShareLink = async () => {
    try {
      const link = await generateShareLink();
      setShareLink(link);
      setShowShareModal(true);
    } catch (err) {
      console.error('Failed to generate share link:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCitySelect = async (city: { lat: number; lng: number; name: string }) => {
    if (mapRef.current && !isMapLocked) {
      try {
        await addPin({ lat: city.lat, lng: city.lng, name: city.name });
        showToast(`Pin added successfully at ${city.name}!`, 'success');
        
        // Center the map on the newly added pin
        if (mapRef.current.centerMapOnLocation) {
          mapRef.current.centerMapOnLocation(city.lat, city.lng);
        }
      } catch (error) {
        console.error('Failed to add pin:', error);
        showToast('Failed to add pin. Please try again.', 'error');
      }
    }
  };

  const handlePinAdded = (pinName: string) => {
    showToast(`Pin added successfully at ${pinName}!`, 'success');
  };

  const handleDeleteAllPins = async () => {
    if (!isMapCreator) {
      showToast('Only the map creator can delete all pins.', 'error');
      return;
    }

    if (pins.length === 0) {
      showToast('There are no pins to delete.', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${pins.length} pins? This action cannot be undone.`)) {
      return;
    }

    try {
      const deletedCount = await deleteAllPins();
      showToast(`Successfully deleted ${deletedCount} pins!`, 'success');
    } catch (error) {
      console.error('Failed to delete all pins:', error);
      showToast('Failed to delete all pins. Please try again.', 'error');
    }
  };

  // const handleHighlightPins = (pinIds: string[]) => {
  //   setHighlightedPins(pinIds);
  // };

  // const handleMoveMap = (center: { lat: number; lng: number }, zoom?: number) => {
  //   if (mapRef.current && mapRef.current.centerMapOnLocation) {
  //     mapRef.current.centerMapOnLocation(center.lat, center.lng, zoom);
  //   }
  // };

  const isMapLocked = map?.isLocked || (map?.editableUntil ? map.editableUntil.toDate() <= new Date() : false);
  const isMapCreator = !!(user && map && user.uid === map.ownerId);
  const mapCenter = getMapCenter(pins);

  if (mapLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (mapError || !map) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Map Not Found</h2>
          <p className="text-gray-600 mb-6">The map you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{map.name}</h1>
              <p className="text-sm text-gray-500">
                {pins.length} pin{pins.length !== 1 ? 's' : ''} • 
                {isMapLocked ? ' Locked' : ' Open for pins'}
                {isMapCreator && ' • You are the map creator'}
              </p>
            </div>
            
            <div className="flex space-x-2">
              {isMapCreator && pins.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDeleteAllPins}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete All Pins
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateShareLink}
                disabled={linkLoading}
              >
                {linkLoading ? 'Generating...' : 'Share Link'}
              </Button>
              <Button
                size="sm"
                onClick={() => window.location.href = '/'}
              >
                Home
              </Button>
            </div>
          </div>
          
          {!isMapLocked && (
            <div className="flex justify-center">
              <CitySearchBar 
                onCitySelect={handleCitySelect}
                disabled={isMapLocked}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <MapView
          ref={mapRef}
          mapId={mapId || ''}
          pins={pins}
          onAddPin={addPin}
          onDeletePin={isMapCreator ? deletePin : undefined}
          onPinAdded={handlePinAdded}
          isLocked={isMapLocked}
          canDeletePins={isMapCreator}
        />
        
        {/* <Chatbot
          pins={pins}
          mapCenter={mapCenter}
          mapName={map.name}
          isLocked={isMapLocked}
          onHighlightPins={handleHighlightPins}
          onMoveMap={handleMoveMap}
          onAddPin={addPin}
          onPinAdded={handlePinAdded}
        /> */}
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Map</h3>
            <p className="text-sm text-gray-600 mb-4">
              Share this link with others so they can add pins to your map:
            </p>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <Button size="sm" onClick={handleCopyLink}>
                Copy
              </Button>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowShareModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
