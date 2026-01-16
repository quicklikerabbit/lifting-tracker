import { Timestamp } from 'firebase/firestore';

export interface Log {
  id: string;
  userId: string;
  userName: string;
  weight: number;
  timestamp: Timestamp;
  photoURL?: string | null;
}

export interface LeaderboardEntry {
  userName: string;
  value: number;
  photoURL: string | null;
}

export interface LeaderboardData {
  totalWeight: LeaderboardEntry[];
  mostLifts: LeaderboardEntry[];
  topDailyTotal: LeaderboardEntry[];
}
