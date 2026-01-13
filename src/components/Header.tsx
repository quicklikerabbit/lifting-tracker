import type { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Header({ user, onLogin, onLogout }: HeaderProps) {
  return (
    <header className="flex justify-between items-center">
      <h1 className="text-2xl font-bold tracking-tight">6M Lbs Challenge</h1>
      {user ? (
        <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-800">
          Sign Out
        </button>
      ) : (
        <button 
          onClick={onLogin}
          className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Sign In
        </button>
      )}
    </header>
  );
}
