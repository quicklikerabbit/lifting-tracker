import type { User } from 'firebase/auth';
import { useState } from 'react';
import { addLog } from '../services/logsService';

interface InputFormProps {
  currentUser?: User;
}

export default function InputForm({ currentUser }: InputFormProps) {
  const [loading, setLoading] = useState(false);
  const [dateInput, setDateInput] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [weightInput, setWeightInput] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !weightInput) return;

    const weight = parseInt(weightInput);
    if (isNaN(weight) || weight <= 0) return;

    setLoading(true);
    try {
      await addLog(currentUser, weight, dateInput);
      setWeightInput('');
    } catch (error) {
      console.error('Error submitting lift', error);
      alert(
        "Failed to submit lift. Make sure the 'stats/global' document exists."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4"
    >
      <h2 className="font-semibold">Log a Lift</h2>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-full sm:w-max border border-slate-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-slate-900 flex items-center">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="bg-transparent focus:outline-none w-full"
            />
          </div>
          <input
            inputMode="numeric"
            type="number"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="Weight (lbs)"
            className="w-full sm:flex-1 border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
