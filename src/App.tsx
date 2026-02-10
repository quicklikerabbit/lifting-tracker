import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import Leaderboard from './components/Leaderboard';
import ProgressCard from './components/ProgressCard';
import RecentActivity from './components/RecentActivity';
import AllLifts from './components/AllLifts';
import Tabs, { type Tab } from './components/Tabs';
import { auth } from './firebase';
import './index.css';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('recent');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setActiveTab('recent');
      }
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
        {user && <Tabs activeTab={activeTab} onTabChange={setActiveTab} />}
        <div>
          {user ? (
            <>
              <div className={activeTab === 'recent' ? '' : 'hidden'}>
                <RecentActivity currentUserId={user.uid} />
              </div>
              <div className={activeTab === 'myLifts' ? '' : 'hidden'}>
                <AllLifts currentUserId={user.uid} />
              </div>
            </>
          ) : (
            <RecentActivity />
          )}
        </div>
      </div>
    </div>
  );
}
