'use client';
// src/app/auth/login/page.tsx
import { useState }       from 'react';
import { useRouter }      from 'next/navigation';
import Link               from 'next/link';
import { authApi }        from '@/lib/api';
import { useAuthStore }   from '@/store/auth';
import type { User }      from '@/types';
import { BookOpen }       from 'lucide-react';

export default function LoginPage() {
  const router    = useRouter();
  const { setAuth } = useAuthStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { user, accessToken } = res.data as { user: User; accessToken: string };
      setAuth(user, accessToken);
      router.push('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 page-enter">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <div className="mb-7">
            <div className="w-10 h-10 bg-ink-900 rounded-xl flex items-center justify-center mb-5">
              <BookOpen size={18} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink-900">Welcome back</h1>
            <p className="text-sm text-ink-500 mt-1">Sign in to continue learning.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">Email</label>
              <input className="input" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : 'Sign in'
              }
            </button>
          </form>

          <p className="text-center text-xs text-ink-500 mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-ink-800 font-medium hover:text-accent underline underline-offset-2">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
