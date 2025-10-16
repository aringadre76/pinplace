import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Pin } from '../types';

export const useMapPins = (mapId: string) => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapId) return;

    const pinsRef = collection(db, 'maps', mapId, 'pins');
    const q = query(pinsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const pinsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Pin[];
        setPins(pinsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching pins:', err);
        setError('Failed to load pins');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [mapId]);

  return { pins, loading, error };
};
