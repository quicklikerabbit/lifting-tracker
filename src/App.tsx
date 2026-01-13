import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit, 
  writeBatch, 
  increment, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import './index.css';

import type { User } from 'firebase/auth'

// Types
interface Log {
  id: string;
  userId: string;
  userName: string;
  weight: number;
  timestamp: Timestamp;
}

const GOAL = 6000000;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [totalLifted, setTotalLifted] = useState(0);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Stats (Global Total)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "stats", "global"), (doc) => {
      if (doc.exists()) {
        setTotalLifted(doc.data().totalWeightLifted || 0);
      }
    });
    return () => unsub();
  }, []);

  // 3. Real-time Recent Logs
  useEffect(() => {
    const q = query(
      collection(db, "logs"),
      orderBy("timestamp", "desc"),
      limit(10)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Log[];
      setRecentLogs(logs);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !weightInput) return;

    const weight = parseInt(weightInput);
    if (isNaN(weight) || weight <= 0) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Ref for new log
      const logRef = doc(collection(db, "logs"));
      batch.set(logRef, {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        weight: weight,
        timestamp: serverTimestamp()
      });

      // Ref for global stats
      const statsRef = doc(db, "stats", "global");
      // Note: Ensure this doc exists in Firestore or use set with merge if first run
      batch.update(statsRef, { 
        totalWeightLifted: increment(weight) 
      });

      await batch.commit();
      setWeightInput('');
    } catch (error) {
      console.error("Error submitting lift", error);
      alert("Failed to submit lift. Make sure the 'stats/global' document exists.");
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = Math.min((totalLifted / GOAL) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">6M Lbs Challenge</h1>
          {user ? (
            <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-800">
              Sign Out
            </button>
          ) : (
            <button 
              onClick={handleLogin}
              className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Sign In
            </button>
          )}
        </header>

        {/* Progress Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-slate-500">Total Progress</span>
            <span className="text-xl font-bold">{totalLifted.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ 6M lbs</span></span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Input Form */}
        {user && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="font-semibold">Log a Lift</h2>
            <div className="flex gap-2">
              <input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="Weight (lbs)"
                className="flex-1 border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                autoFocus
              />
              <button 
                type="submit" 
                disabled={loading || !weightInput}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '...' : 'Log'}
              </button>
            </div>
          </form>
        )}

        {/* Recent Activity */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Recent Lifts</h3>
          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-slate-400 text-sm italic">No lifts recorded yet.</p>
            ) : (
              recentLogs.map((log) => (
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

      </div>
    </div>
  );
}