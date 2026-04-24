import { useMemo } from 'react';
import { useLogs } from '../hooks/useLogs';
import type { LeaderboardEntry } from '../types';
import { processLogsForLeaderboard } from '../utilities';

function Board({
  title,
  entries,
  unit,
}: {
  title: string;
  entries: LeaderboardEntry[];
  unit?: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
        {title}
      </h3>
      <ul className="space-y-2 mt-2">
        {entries.map((user, index) => (
          <li key={index} className="flex items-center text-sm">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.userName}
                className="w-6 h-6 rounded-full mr-2"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="font-medium text-slate-900">{user.userName}</span>
            <span className="ml-auto font-bold text-emerald-600">
              {user.value.toLocaleString()}
              {unit ? ` ${unit}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Leaderboard() {
  const logs = useLogs();
  const data = useMemo(
    () => (logs.length > 0 ? processLogsForLeaderboard(logs) : null),
    [logs]
  );

  if (!data) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
      <h2 className="font-semibold">Leaderboard</h2>
      <div className="flex flex-col gap-4">
        <Board title="Total Weight" entries={data.totalWeight} unit="lbs" />
        <Board title="Total Lifts" entries={data.mostLifts} />
        <Board title="Max Daily" entries={data.topDailyTotal} unit="lbs" />
        <Board
          title="Avg / Session"
          entries={data.avgWeightPerSession}
          unit="lbs"
        />
        <Board title="Best Week" entries={data.bestWeekTotal} unit="lbs" />
      </div>
    </div>
  );
}
