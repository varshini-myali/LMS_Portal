'use client';
// src/components/ui/TopNav.tsx
import Link            from 'next/link';
import { useRouter }   from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi }     from '@/lib/api';
import { BookOpen, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useState }    from 'react';

export function TopNav() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    router.push('/');
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-sand-100/90 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-ink-900 rounded-lg flex items-center justify-center
                          group-hover:bg-accent transition-colors duration-200">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="font-display font-semibold text-ink-900 text-lg tracking-tight">Lumen</span>
        </Link>

        {/* nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-ink-600 hover:text-ink-900 transition-colors font-medium">
            Subjects
          </Link>
          {user && (
            <Link href="/profile" className="text-sm text-ink-600 hover:text-ink-900 transition-colors font-medium">
              My Learning
            </Link>
          )}
        </nav>

        {/* auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-ink-100 transition-colors"
              >
                <div className="w-7 h-7 bg-accent-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-accent-700">
                    {user.name[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-ink-800 hidden sm:block">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} className="text-ink-500" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 card shadow-lg py-1 animate-fade-in">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-sand-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserIcon size={14} /> Profile
                  </Link>
                  <hr className="my-1 border-ink-100" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-ink-700 hover:bg-sand-100"
                  >
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login"    className="btn-ghost text-sm py-2 px-4">Sign in</Link>
              <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
