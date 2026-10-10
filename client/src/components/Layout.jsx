import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { btnQuiet } from './ui.js';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="border-b border-rule bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="text-2xl font-extrabold tracking-tight">
            SplitEase
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-soft sm:inline">{user.name}</span>
            <button onClick={logout} className={btnQuiet}>Log out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
