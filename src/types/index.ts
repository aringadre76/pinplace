import { Timestamp } from 'firebase/firestore';

export interface Map {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  editableUntil: Timestamp | null;
  lockType: 'manual' | 'duration' | 'datetime';
  isLocked: boolean;
}

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  name: string;
  description?: string;
  createdAt: Timestamp;
}

export interface ShareLink {
  id: string;
  token: string;
  createdAt: Timestamp;
  expiresAt: Timestamp | null;
}

export interface CreateMapData {
  name: string;
  lockType: 'manual' | 'duration' | 'datetime';
  duration?: number;
  lockDate?: Date;
}

export interface AddPinData {
  lat: number;
  lng: number;
  name: string;
  description?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export type LockStatus = 'open' | 'locked' | 'expiring';
