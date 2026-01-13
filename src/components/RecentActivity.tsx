import type { Log } from '../types';

interface RecentActivityProps {
  logs: Log[];
  currentUserId?: string;
  onDelete: (log: Log) => void;
}

export default function RecentActivity({
  logs,
  currentUserId,
  onDelete,
}: RecentActivityProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
        Recent Lifts
      </h3>
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-slate-400 text-sm italic">
            No lifts recorded yet.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                {log.photoURL && (
                  <img
                    src={log.photoURL}
                    alt={log.userName}
                    className="w-8 h-8 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900">
                    {log.userName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {log.timestamp?.toDate().toLocaleDateString()}{' '}
                    {log.timestamp?.toDate().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-600">
                  +{log.weight.toLocaleString()} lbs
                </span>
                {currentUserId === log.userId && (
                  <button
                    onClick={() => onDelete(log)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-slate-50"
                    title="Delete log"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 0 0 1.5.06l.3-7.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
