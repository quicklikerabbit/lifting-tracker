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

const DAY_MS = 86400000;
const PROJECTION_WINDOW_DAYS = 28;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayIndex(date: Date, start: Date): number {
  return Math.round((startOfDay(date).getTime() - start.getTime()) / DAY_MS);
}

export function dateForDay(start: Date, day: number): Date {
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + day);
}

export interface ContributorSeries {
  userId: string;
  userName: string;
  total: number;
  // Cumulative lbs at the end of each day, indexed from ProgressSeries.start.
  cumulative: number[];
}

export interface ProgressSeries {
  start: Date;
  todayIndex: number;
  yearEndIndex: number;
  // Largest total first.
  contributors: ContributorSeries[];
  totals: number[];
  dailyRate: number;
  projectedYearEnd: number;
}

export function buildProgressSeries(
  logs: Log[],
  now: Date = new Date()
): ProgressSeries | null {
  if (logs.length === 0) return null;

  const dated = logs.map((log) => ({
    log,
    date: log.timestamp?.toDate() ?? now,
  }));

  const start = startOfDay(
    new Date(Math.min(...dated.map((d) => d.date.getTime())))
  );
  const todayIndex = dayIndex(now, start);
  const yearEndIndex = dayIndex(new Date(now.getFullYear(), 11, 31), start);

  const dailyByUser = new Map<string, number[]>();
  const names = new Map<string, string>();
  const windowStart = todayIndex - PROJECTION_WINDOW_DAYS + 1;
  let windowTotal = 0;

  dated.forEach(({ log, date }) => {
    const day = Math.min(dayIndex(date, start), todayIndex);
    if (!dailyByUser.has(log.userId)) {
      dailyByUser.set(log.userId, new Array(todayIndex + 1).fill(0));
    }
    dailyByUser.get(log.userId)![day] += log.weight;
    names.set(log.userId, log.userName);
    if (day >= windowStart) windowTotal += log.weight;
  });

  const contributors = [...dailyByUser.entries()]
    .map(([userId, daily]) => {
      let running = 0;
      const cumulative = daily.map((w) => (running += w));
      return {
        userId,
        userName: names.get(userId)!,
        total: running,
        cumulative,
      };
    })
    .sort((a, b) => b.total - a.total);

  const totals = new Array(todayIndex + 1).fill(0);
  contributors.forEach((c) =>
    c.cumulative.forEach((v, i) => {
      totals[i] += v;
    })
  );

  // Average daily volume over the last 4 weeks (or since the first lift, if
  // the team hasn't been going that long), extended to Dec 31.
  const dailyRate =
    windowTotal / Math.min(PROJECTION_WINDOW_DAYS, todayIndex + 1);
  const projectedYearEnd =
    totals[todayIndex] + dailyRate * Math.max(0, yearEndIndex - todayIndex);

  return {
    start,
    todayIndex,
    yearEndIndex,
    contributors,
    totals,
    dailyRate,
    projectedYearEnd,
  };
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
