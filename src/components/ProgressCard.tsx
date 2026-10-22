import { useState } from 'react';
import { useGlobalStats } from '../hooks/useGlobalStats';
import ProgressChart from './ProgressChart';

const goal = 6000000;

type View = 'bar' | 'trend';

const views: { id: View; label: string }[] = [
  { id: 'bar', label: 'Overview' },
  { id: 'trend', label: 'Trend' },
];

export default function ProgressCard({ isLoggedIn }: { isLoggedIn: boolean }) {
  const totalLifted = useGlobalStats();
  const progressPercentage = Math.min((totalLifted / goal) * 100, 100);
  const [selectedView, setSelectedView] = useState<View>('bar');
  // Logged-out users only get the overview bar
  const view = isLoggedIn ? selectedView : 'bar';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      {isLoggedIn && (
        <nav
          className="flex gap-4 mb-4 border-b border-slate-100"
          aria-label="Progress views"
        >
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedView(v.id)}
              className={`${
                view === v.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              } -mb-px pb-2 border-b-2 text-xs font-medium focus:outline-none`}
              aria-current={view === v.id ? 'page' : undefined}
            >
              {v.label}
            </button>
          ))}
        </nav>
      )}
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-slate-500">
          Total Progress
        </span>
        <span className="text-xl font-bold">
          {totalLifted.toLocaleString()}{' '}
          <span className="text-sm font-normal text-slate-400">
            / {goal.toLocaleString()} lbs
          </span>
        </span>
      </div>
      {view === 'bar' ? (
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      ) : (
        <div className="mt-4">
          <ProgressChart goal={goal} />
        </div>
      )}
    </div>
  );
}
