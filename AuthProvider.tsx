'use client';
// src/components/auth/AuthProvider.tsx
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate  = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => { hydrate(); }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-ink-300 border-t-ink-800 rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
