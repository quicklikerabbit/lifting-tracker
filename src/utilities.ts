import type { LeaderboardData, Log } from './types';

function isoWeekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function processLogsForLeaderboard(logs: Log[]): LeaderboardData {
  const userStats: {
    [userId: string]: {
      userName: string;
      photoURL: string | null;
      totalWeight: number;
      liftCount: number;
      dailyTotals: { [date: string]: number };
      weeklyTotals: { [week: string]: number };
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
        weeklyTotals: {},
      };
    }
    const stats = userStats[log.userId];
    stats.totalWeight += log.weight;
    stats.liftCount++;

    if (log.timestamp) {
      const date = log.timestamp.toDate();
      const dateKey = date.toLocaleDateString();
      stats.dailyTotals[dateKey] =
        (stats.dailyTotals[dateKey] || 0) + log.weight;

      const weekKey = isoWeekKey(date);
      stats.weeklyTotals[weekKey] =
        (stats.weeklyTotals[weekKey] || 0) + log.weight;
    }
  });

  const users = Object.values(userStats);

  const totalWeight = users
    .map((u) => ({
      userName: u.userName,
      value: u.totalWeight,
      photoURL: u.photoURL,
    }))
    .sort((a, b) => b.value - a.value);

  const mostLifts = users
    .map((u) => ({
      userName: u.userName,
      value: u.liftCount,
      photoURL: u.photoURL,
    }))
    .sort((a, b) => b.value - a.value);

  const topDailyTotal = users
    .map((u) => ({
      userName: u.userName,
      value: Math.max(0, ...Object.values(u.dailyTotals)),
      photoURL: u.photoURL,
    }))
    .sort((a, b) => b.value - a.value);

  const currentWeekKey = isoWeekKey(new Date());
  const weightThisWeek = users
    .map((u) => ({
      userName: u.userName,
      value: u.weeklyTotals[currentWeekKey] || 0,
      photoURL: u.photoURL,
    }))
    .sort((a, b) => b.value - a.value);

  const bestWeekTotal = users
    .map((u) => ({
      userName: u.userName,
      value: Math.max(0, ...Object.values(u.weeklyTotals)),
      photoURL: u.photoURL,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    totalWeight,
    mostLifts,
    topDailyTotal,
    weightThisWeek,
    bestWeekTotal,
  };
}
