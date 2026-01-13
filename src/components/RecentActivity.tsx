import type { Log } from "../types";


interface RecentActivityProps {
  logs: Log[];
}

export default function RecentActivity({ logs }: RecentActivityProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Recent Lifts</h3>
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-slate-400 text-sm italic">No lifts recorded yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">{log.userName}</span>
                <span className="text-xs text-slate-400">
                  {log.timestamp?.toDate().toLocaleDateString()} {log.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <span className="font-bold text-emerald-600">+{log.weight} lbs</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}