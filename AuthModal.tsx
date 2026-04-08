'use client';
// src/components/auth/AuthModal.tsx
import { useState }      from 'react';
import { useRouter }     from 'next/navigation';
import { X, BookOpen }   from 'lucide-react';
import { authApi }       from '@/lib/api';
import { useAuthStore }  from '@/store/auth';
import type { User }     from '@/types';

interface AuthModalProps {
  onClose:   () => void;
  onSuccess: () => void;
  intent?:   'enroll' | 'wishlist';
}

export function AuthModal({ onClose, onSuccess, intent }: AuthModalProps) {
  const [tab, setTab]       = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const { setAuth }         = useAuthStore();

  // login form
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  // register extras
  const [name, setName]       = useState('');
  const [confirm, setConfirm] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (tab === 'register' && password !== confirm) {
      setError('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      const payload = tab === 'login'
        ? await authApi.login({ email, password })
        : await authApi.register({ name, email, password });

      const { user, accessToken } = payload.data as { user: User; accessToken: string };
      setAuth(user, accessToken);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const intentLabel = intent === 'enroll' ? 'enrol in this course' : 'add to wishlist';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative card w-full max-w-md shadow-2xl animate-fade-up">
        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-ink-100 text-ink-500"
        >
          <X size={16} />
        </button>

        <div className="p-8">
          {/* header */}
          <div className="mb-6">
            <div className="w-10 h-10 bg-ink-900 rounded-xl flex items-center justify-center mb-4">
              <BookOpen size={18} className="text-white" />
            </div>
            <h2 className="font-display text-xl font-semibold text-ink-900">
              {intent ? `Sign in to ${intentLabel}` : 'Welcome to Lumen'}
            </h2>
            <p className="text-sm text-ink-500 mt-1">
              {intent
                ? 'Create a free account or log in to continue.'
                : 'Sign in or create your account.'}
            </p>
          </div>

          {/* tabs */}
          <div className="flex bg-sand-200 rounded-lg p-1 mb-6">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {t === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Full name</label>
                <input
                  className="input"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">Confirm password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : tab === 'login' ? 'Sign in' : 'Create account'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
