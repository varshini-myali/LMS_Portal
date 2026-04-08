'use client';
// src/app/page.tsx
import { useEffect, useState } from 'react';
import Link                    from 'next/link';
import { subjectApi, fmtDuration } from '@/lib/api';
import type { Subject }        from '@/types';
import { Clock, Users, ChevronRight, BookOpen, Layers } from 'lucide-react';

const LEVEL_COLOR: Record<string, string> = {
  beginner:     'bg-sage-50 text-sage-700 border-sage-200',
  intermediate: 'bg-accent-50 text-accent-700 border-accent-200',
  advanced:     'bg-ink-100 text-ink-700 border-ink-200',
};

function SubjectRow({ subject, idx }: { subject: Subject; idx: number }) {
  return (
    <div
      className="group flex gap-5 items-start p-5 sm:p-6 hover:bg-white rounded-2xl transition-all
                 duration-200 border border-transparent hover:border-ink-100 hover:shadow-sm"
      style={{ animationDelay: `${idx * 60}ms` }}
    >
      {/* index */}
      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full
                       bg-sand-300 text-ink-500 text-xs font-mono font-medium mt-0.5">
        {String(idx + 1).padStart(2, '0')}
      </span>

      {/* body */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-2 items-center mb-1.5">
          <span className={`badge border ${LEVEL_COLOR[subject.level]}`}>
            {subject.level}
          </span>
          <span className="text-xs text-ink-400">{subject.language}</span>
        </div>

        <h2 className="font-display text-lg font-semibold text-ink-900 group-hover:text-accent
                       transition-colors leading-snug mb-1 truncate">
          {subject.title}
        </h2>

        <p className="text-sm text-ink-500 line-clamp-2 mb-3">{subject.short_description}</p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-ink-100 flex items-center justify-center text-[10px] font-semibold text-ink-600">
              {subject.instructor_name[0]}
            </div>
            {subject.instructor_name}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={12} /> {subject.video_count} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {fmtDuration(subject.total_duration)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} /> {subject.enrollment_count.toLocaleString()} enrolled
          </span>
        </div>
      </div>

      {/* arrow */}
      <Link
        href={`/subjects/${subject.id}`}
        className="flex-shrink-0 self-center flex items-center gap-1.5 btn-outline text-xs py-1.5 px-3
                   group-hover:bg-ink-900 group-hover:text-white group-hover:border-ink-900 transition-all"
      >
        View <ChevronRight size={13} />
      </Link>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-5 items-start p-5 sm:p-6">
      <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="skeleton h-3.5 w-16 rounded" />
        <div className="skeleton h-5 w-2/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-48 rounded mt-1" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    subjectApi.list()
      .then((r) => setSubjects(r.data.subjects))
      .catch(() => setError('Failed to load subjects'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 page-enter">
      {/* hero */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="badge bg-accent-50 border border-accent-200 text-accent-700">
            <Layers size={10} /> All subjects
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink-900 leading-tight mb-4">
          Learn something<br />
          <em className="not-italic text-accent">meaningful</em> today.
        </h1>
        <p className="text-ink-500 text-base max-w-xl leading-relaxed">
          Carefully curated video courses taught by expert instructors.
          Go at your own pace, track your progress, and build real skills.
        </p>
      </div>

      {/* divider with count */}
      {!loading && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-medium text-ink-500 font-mono">
            {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} available
          </span>
          <div className="flex-1 h-px bg-ink-100" />
        </div>
      )}

      {/* list */}
      <div className="space-y-1">
        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        {error   && <p className="text-sm text-red-600 text-center py-8">{error}</p>}
        {!loading && !error && subjects.length === 0 && (
          <p className="text-sm text-ink-500 text-center py-12">No subjects available yet.</p>
        )}
        {subjects.map((s, i) => <SubjectRow key={s.id} subject={s} idx={i} />)}
      </div>
    </div>
  );
}
