import { query, collection, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import type { LeaderboardData, Log } from '../types';
import { processLogsForLeaderboard } from '../utilities';

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'logs'));
    const unsub = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map((doc) => doc.data() as Log);
      if (logs.length > 0) {
        setData(processLogsForLeaderboard(logs));
      }
    });
    return () => unsub();
  }, []);

  if (!data) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
      <h2 className="font-semibold">Leaderboard</h2>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            Total Weight
          </h3>
          <ul className="space-y-2 mt-2">
            {data.totalWeight.map((user, index) => (
              <li key={index} className="flex items-center text-sm">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.userName}
                    className="w-6 h-6 rounded-full mr-2"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="font-medium text-slate-900">
                  {user.userName}
                </span>
                <span className="ml-auto font-bold text-emerald-600">
                  {user.value.toLocaleString()} lbs
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            Total Lifts
          </h3>
          <ul className="space-y-2 mt-2">
            {data.mostLifts.map((user, index) => (
              <li key={index} className="flex items-center text-sm">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.userName}
                    className="w-6 h-6 rounded-full mr-2"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="font-medium text-slate-900">
                  {user.userName}
                </span>
                <span className="ml-auto font-bold text-emerald-600">
                  {user.value.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            Max Daily
          </h3>
          <ul className="space-y-2 mt-2">
            {data.topDailyTotal.map((user, index) => (
              <li key={index} className="flex items-center text-sm">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.userName}
                    className="w-6 h-6 rounded-full mr-2"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="font-medium text-slate-900">
                  {user.userName}
                </span>
                <span className="ml-auto font-bold text-emerald-600">
                  {user.value.toLocaleString()} lbs
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
