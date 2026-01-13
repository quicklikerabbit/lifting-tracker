interface ProgressCardProps {
  totalLifted: number;
  goal: number;
}

export default function ProgressCard({ totalLifted, goal }: ProgressCardProps) {
  const progressPercentage = Math.min((totalLifted / goal) * 100, 100);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
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
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
