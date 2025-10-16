import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AddPinData } from '../types';

export const useAddPin = (mapId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPin = async (pinData: AddPinData) => {
    setLoading(true);
    setError(null);

    try {
      const pinsRef = collection(db, 'maps', mapId, 'pins');
      await addDoc(pinsRef, {
        ...pinData,
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error('Error adding pin:', err);
      setError(err.message || 'Failed to add pin');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addPin, loading, error };
};
