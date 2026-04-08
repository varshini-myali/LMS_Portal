'use client';
// src/app/profile/page.tsx
import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import Link                    from 'next/link';
import { useAuthStore }        from '@/store/auth';
import { subjectApi, progressApi, enrollApi, fmtDuration } from '@/lib/api';
import type { Subject, SubjectProgress } from '@/types';
import {
  BookOpen, Clock, CheckCircle2, Play, Layers,
  LogOut, User as UserIcon, TrendingUp,
} from 'lucide-react';
import { authApi } from '@/lib/api';

interface EnrolledSubject {
  subject: Subject;
  progress: SubjectProgress;
}

export default function ProfilePage() {
  const router       = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [enrolled, setEnrolled] = useState<EnrolledSubject[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }

    // fetch subjects list then filter by enrollment status
    subjectApi.list().then(async (res) => {
      const subjects: Subject[] = res.data.subjects;
      // check enrollment + progress for each
      const results = await Promise.all(
        subjects.map(async (s) => {
          try {
            const [subjRes, progRes] = await Promise.all([
              subjectApi.get(s.id),
              progressApi.getSubject(s.id),
            ]);
            if (!subjRes.data.enrolled) return null;
            return { subject: s, progress: progRes.data as SubjectProgress };
          } catch { return null; }
        })
      );
      setEnrolled(results.filter(Boolean) as EnrolledSubject[]);
    }).finally(() => setLoading(false));
  }, [user, router]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    router.push('/');
  };

  if (!user) return null;

  const totalCompleted = enrolled.reduce((a, e) => a + e.progress.completed_videos, 0);
  const totalLessons   = enrolled.reduce((a, e) => a + e.progress.total_videos, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 page-enter">

      {/* header */}
      <div className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent-100 flex items-center justify-center
                          text-xl font-semibold text-accent-700 font-display">
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-900">{user.name}</h1>
            <p className="text-sm text-ink-500">{user.email}</p>
            <span className="badge bg-ink-100 text-ink-600 mt-1 capitalize">{user.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost text-sm gap-1.5 text-ink-500">
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Enrolled subjects', value: enrolled.length, icon: <Layers size={16} /> },
          { label: 'Lessons completed', value: totalCompleted, icon: <CheckCircle2 size={16} /> },
          { label: 'Total lessons',     value: totalLessons,   icon: <BookOpen size={16} /> },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center gap-2 text-ink-400 mb-2">
              {stat.icon}
              <span className="text-xs text-ink-500">{stat.label}</span>
            </div>
            <p className="font-display text-3xl font-semibold text-ink-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* enrolled subjects */}
      <div>
        <h2 className="font-display text-xl font-semibold text-ink-900 mb-5 flex items-center gap-2">
          <TrendingUp size={18} className="text-accent" /> My learning
        </h2>

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="card p-5 flex gap-4">
                <div className="skeleton w-10 h-10 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-1/2 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && enrolled.length === 0 && (
          <div className="card p-10 text-center">
            <UserIcon size={32} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500 mb-4">You haven't enrolled in any subjects yet.</p>
            <Link href="/" className="btn-primary inline-flex">Browse subjects</Link>
          </div>
        )}

        <div className="space-y-3">
          {enrolled.map(({ subject, progress }) => (
            <div key={subject.id} className="card p-5 flex gap-4 hover:shadow-md transition-shadow">
              {/* icon */}
              <div className="w-10 h-10 rounded-xl bg-ink-900 flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} className="text-white" />
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink-900 text-sm truncate">{subject.title}</h3>
                    <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{subject.short_description}</p>
                  </div>
                  <span className="text-xs font-mono font-medium text-ink-700 flex-shrink-0">
                    {progress.percent}%
                  </span>
                </div>

                {/* progress bar */}
                <div className="mt-3">
                  <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress.percent}%`,
                        backgroundColor: progress.percent === 100 ? '#4a7c6a' : '#e85d26',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-xs text-ink-500">
                    <span>{progress.completed_videos} / {progress.total_videos} lessons</span>
                    {progress.percent === 100 && (
                      <span className="flex items-center gap-1 text-sage font-medium">
                        <CheckCircle2 size={11} /> Complete
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0 self-center">
                <Link
                  href={
                    progress.last_video_id
                      ? `/subjects/${subject.id}/video/${progress.last_video_id}`
                      : `/subjects/${subject.id}`
                  }
                  className="btn-outline text-xs py-1.5 px-3 gap-1.5"
                >
                  <Play size={11} />
                  {progress.percent === 0 ? 'Start' : progress.percent === 100 ? 'Review' : 'Resume'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
