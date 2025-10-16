import React from 'react';
import { Map } from '../types';
import { useMapLockStatus } from '../hooks/useMapLockStatus';

interface LockStatusBadgeProps {
  map: Map;
  className?: string;
}

export const LockStatusBadge: React.FC<LockStatusBadgeProps> = ({ map, className = '' }) => {
  const { lockStatus, timeRemaining } = useMapLockStatus(map);

  const getStatusConfig = () => {
    switch (lockStatus) {
      case 'locked':
        return {
          text: 'Locked',
          className: 'bg-red-100 text-red-800'
        };
      case 'expiring':
        return {
          text: `Expires in ${timeRemaining}`,
          className: 'bg-yellow-100 text-yellow-800'
        };
      default:
        return {
          text: 'Open',
          className: 'bg-green-100 text-green-800'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className} ${className}`}>
      {config.text}
    </span>
  );
};
