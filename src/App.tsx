import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import Leaderboard from './components/Leaderboard';
import ProgressCard from './components/ProgressCard';
import RecentActivity from './components/RecentActivity';
import { auth } from './firebase';
import './index.css';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-6">
        <Header user={user} />
        <ProgressCard />
        {user && <InputForm currentUser={user} />}
        <Leaderboard />
        <RecentActivity currentUserId={user?.uid} />
      </div>
    </div>
  );
}
