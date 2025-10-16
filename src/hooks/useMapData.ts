import { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Map } from '../types';

export const useMapData = (mapId: string) => {
  const [map, setMap] = useState<Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapId) return;

    // Simulate a timeout for demo purposes
    const timeout = setTimeout(() => {
      setError('Map not found');
      setLoading(false);
    }, 2000);

    // Try to fetch from Firebase, but handle errors gracefully
    try {
      const mapRef = doc(db, 'maps', mapId);
      
      getDoc(mapRef).then((docSnap) => {
        clearTimeout(timeout);
        if (docSnap.exists()) {
          setMap({ id: docSnap.id, ...docSnap.data() } as Map);
        } else {
          setError('Map not found');
        }
        setLoading(false);
      }).catch((err) => {
        clearTimeout(timeout);
        console.error('Error fetching map:', err);
        setError('Map not found');
        setLoading(false);
      });
    } catch (err) {
      clearTimeout(timeout);
      console.error('Error fetching map:', err);
      setError('Map not found');
      setLoading(false);
    }

    return () => clearTimeout(timeout);
  }, [mapId]);

  return { map, loading, error };
};

export const useShareLink = (mapId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateShareLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const shareLinksRef = collection(db, 'maps', mapId, 'shareLinks');
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      await addDoc(shareLinksRef, {
        token,
        createdAt: serverTimestamp(),
        expiresAt: null
      });

      return `${window.location.origin}/map/${mapId}?token=${token}`;
    } catch (err: any) {
      console.error('Error generating share link:', err);
      setError(err.message || 'Failed to generate share link');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateShareLink, loading, error };
};
