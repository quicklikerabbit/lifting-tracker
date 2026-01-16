import type { LeaderboardData, Log } from './types';

export const processLogsForLeaderboard = (logs: Log[]): LeaderboardData => {
  const userStats: {
    [userId: string]: {
      userName: string;
      photoURL: string | null;
      totalWeight: number;
      liftCount: number;
      dailyTotals: { [date: string]: number };
    };
  } = {};

  logs.forEach((log) => {
    if (!userStats[log.userId]) {
      userStats[log.userId] = {
        userName: log.userName,
        photoURL: log.photoURL || null,
        totalWeight: 0,
        liftCount: 0,
        dailyTotals: {},
      };
    }
    const stats = userStats[log.userId];
    stats.totalWeight += log.weight;
    stats.liftCount++;

    if (log.timestamp) {
      const date = log.timestamp.toDate().toLocaleDateString();
      if (!stats.dailyTotals[date]) {
        stats.dailyTotals[date] = 0;
      }
      stats.dailyTotals[date] += log.weight;
    }
  });

  const users = Object.values(userStats);

  const totalWeight = users
    .map((u) => ({
      userName: u.userName,
      value: u.totalWeight,
      photoURL: u.photoURL,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const mostLifts = users
    .map((u) => ({
      userName: u.userName,
      value: u.liftCount,
      photoURL: u.photoURL,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const topDailyTotal = users
    .map((u) => {
      const max = Math.max(0, ...Object.values(u.dailyTotals));
      return {
        userName: u.userName,
        value: max,
        photoURL: u.photoURL,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return { totalWeight, mostLifts, topDailyTotal };
};
