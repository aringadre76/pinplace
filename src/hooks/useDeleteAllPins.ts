import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useDeleteAllPins = (mapId: string) => {
  const deleteAllPins = async () => {
    try {
      const pinsRef = collection(db, 'maps', mapId, 'pins');
      const snapshot = await getDocs(pinsRef);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error deleting all pins:', error);
      throw error;
    }
  };

  return { deleteAllPins };
};




