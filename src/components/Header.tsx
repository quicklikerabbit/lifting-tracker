import { signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  const onLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in', error);
    }
  };

  const onLogout = () => signOut(auth);
  return (
    <header className="flex justify-between items-center">
      <h1 className="text-2xl font-bold tracking-tight">6M Lbs Challenge</h1>
      {user ? (
        <button
          onClick={onLogout}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
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
