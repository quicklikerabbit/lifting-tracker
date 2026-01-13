import { Timestamp } from 'firebase/firestore';

export interface Log {
  id: string;
  userId: string;
  userName: string;
  weight: number;
  timestamp: Timestamp;
}