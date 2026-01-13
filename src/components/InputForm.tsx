import type { FormEvent } from 'react';

interface InputFormProps {
  onSubmit: (e: FormEvent) => void;
  weightInput: string;
  setWeightInput: (value: string) => void;
  dateInput: string;
  setDateInput: (value: string) => void;
  loading: boolean;
}

export default function InputForm({ onSubmit, weightInput, setWeightInput, dateInput, setDateInput, loading }: InputFormProps) {
  return (
    <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
      <h2 className="font-semibold">Log a Lift</h2>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <input
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="Weight (lbs)"
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={loading || !weightInput}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : 'Log'}
            </button>
          </div>
        </div>
    </form>
  );
}
