import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { CreateMapData } from '../types';

export const useCreateMap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createMap = async (mapData: CreateMapData) => {
    if (!user) {
      setError('You must be logged in to create a map');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const mapsRef = collection(db, 'maps');
      const docRef = await addDoc(mapsRef, {
        name: mapData.name,
        ownerId: user.uid,
        lockType: mapData.lockType,
        isLocked: false,
        createdAt: serverTimestamp(),
        editableUntil: mapData.lockType === 'manual' 
          ? null 
          : mapData.lockType === 'duration' && mapData.duration
            ? new Date(Date.now() + mapData.duration * 60 * 60 * 1000)
            : mapData.lockDate || null
      });

      return docRef.id;
    } catch (err: any) {
      console.error('Error creating map:', err);
      setError(err.message || 'Failed to create map');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createMap, loading, error };
};
