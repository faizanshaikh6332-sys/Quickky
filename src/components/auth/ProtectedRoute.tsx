import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import AuthModal from './AuthModal';
import { LogIn, Loader2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 via-purple-600 to-amber-500 shadow-xl animate-pulse">
            <img src="/logo.png" alt="Quickky" className="w-full h-full object-contain rounded-full bg-slate-900" />
          </div>
          <div className="absolute -inset-2 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-xl font-black text-gradient-purple tracking-tight">Quickky</span>
        <p className="text-xs text-gray-500 font-extrabold uppercase tracking-widest mt-1">FAST • RELIABLE • NOW</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-gray-50 dark:bg-gray-950">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 mb-6">
          <LogIn size={32} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Authentication Required</h2>
        <p className="text-gray-500 max-w-md mb-6">
          You need to be signed in to access <span className="font-semibold text-purple-600">{location.pathname}</span>. Please sign in to continue.
        </p>
        <div className="flex gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <Home size={16} /> Back to Home
          </Link>
          <button
            onClick={() => setAuthOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-md shadow-purple-500/20"
          >
            <LogIn size={16} /> Sign In
          </button>
        </div>

        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
        />
      </div>
    );
  }

  return <>{children}</>;
}
