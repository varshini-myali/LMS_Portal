// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { TopNav }       from '@/components/ui/TopNav';

export const metadata: Metadata = {
  title:       { default: 'Lumen LMS', template: '%s · Lumen' },
  description: 'Learn at your own pace with curated video courses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <TopNav />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
