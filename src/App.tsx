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
  Timestamp,
} from 'firebase/firestore';
import './index.css';
import type { User } from 'firebase/auth';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ProgressCard from './components/ProgressCard';
import RecentActivity from './components/RecentActivity';
import type { Log } from './types';

const GOAL = 6000000;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [totalLifted, setTotalLifted] = useState(0);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
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
    const unsub = onSnapshot(doc(db, 'stats', 'global'), (doc) => {
      if (doc.exists()) {
        setTotalLifted(doc.data().totalWeightLifted || 0);
      }
    });
    return () => unsub();
  }, []);

  // 3. Real-time Recent Logs
  useEffect(() => {
    const q = query(
      collection(db, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Log[];
      setRecentLogs(logs);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in', error);
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

      // Determine timestamp: use serverTimestamp() if today, otherwise use selected date (midnight)
      const [y, m, d] = dateInput.split('-').map(Number);
      const selectedDate = new Date(y, m - 1, d);
      const now = new Date();
      const isToday =
        selectedDate.getDate() === now.getDate() &&
        selectedDate.getMonth() === now.getMonth() &&
        selectedDate.getFullYear() === now.getFullYear();

      const timestamp = isToday
        ? serverTimestamp()
        : Timestamp.fromDate(selectedDate);

      // Ref for new log
      const logRef = doc(collection(db, 'logs'));
      batch.set(logRef, {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        weight: weight,
        timestamp: timestamp,
        photoURL: user.photoURL,
      });

      // Ref for global stats
      const statsRef = doc(db, 'stats', 'global');
      // Note: Ensure this doc exists in Firestore or use set with merge if first run
      batch.update(statsRef, {
        totalWeightLifted: increment(weight),
      });

      await batch.commit();
      setWeightInput('');
    } catch (error) {
      console.error('Error submitting lift', error);
      alert(
        "Failed to submit lift. Make sure the 'stats/global' document exists."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (log: Log) => {
    if (!user || user.uid !== log.userId) return;
    if (!window.confirm('Are you sure you want to delete this log?')) return;

    try {
      const batch = writeBatch(db);
      const logRef = doc(db, 'logs', log.id);
      const statsRef = doc(db, 'stats', 'global');

      batch.delete(logRef);
      batch.update(statsRef, {
        totalWeightLifted: increment(-log.weight),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting log', error);
      alert('Failed to delete log.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-6">
        <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />

        <ProgressCard totalLifted={totalLifted} goal={GOAL} />

        {user && (
          <InputForm
            onSubmit={handleSubmit}
            weightInput={weightInput}
            setWeightInput={setWeightInput}
            dateInput={dateInput}
            setDateInput={setDateInput}
            loading={loading}
          />
        )}

        <RecentActivity
          logs={recentLogs}
          currentUserId={user?.uid}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
