import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useDeletePin = (mapId: string) => {
  const deletePin = async (pinId: string) => {
    try {
      const pinRef = doc(db, 'maps', mapId, 'pins', pinId);
      await deleteDoc(pinRef);
    } catch (error) {
      console.error('Error deleting pin:', error);
      throw error;
    }
  };

  return { deletePin };
};
