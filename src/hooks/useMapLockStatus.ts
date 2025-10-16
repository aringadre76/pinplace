import { useState, useEffect } from 'react';
import { Map } from '../types';

export const useMapLockStatus = (map: Map | null) => {
  const [lockStatus, setLockStatus] = useState<'open' | 'locked' | 'expiring'>('open');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!map) return;

    const updateLockStatus = () => {
      if (map.isLocked) {
        setLockStatus('locked');
        setTimeRemaining('');
        return;
      }

      if (map.editableUntil) {
        const now = new Date();
        const lockTime = map.editableUntil.toDate();
        const diff = lockTime.getTime() - now.getTime();

        if (diff <= 0) {
          setLockStatus('locked');
          setTimeRemaining('');
        } else {
          setLockStatus('expiring');
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m`);
          } else {
            setTimeRemaining(`${minutes}m`);
          }
        }
      } else {
        setLockStatus('open');
        setTimeRemaining('');
      }
    };

    updateLockStatus();
    
    const interval = setInterval(updateLockStatus, 60000);
    
    return () => clearInterval(interval);
  }, [map]);

  return { lockStatus, timeRemaining };
};
