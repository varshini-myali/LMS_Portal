'use client';
// src/app/subjects/[subjectId]/video/[videoId]/page.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link                     from 'next/link';
import {
  subjectApi, videoApi, progressApi, enrollApi, fmtDuration,
} from '@/lib/api';
import { useAuthStore }          from '@/store/auth';
import { LearningSidebar }       from '@/components/learning/LearningSidebar';
import { YouTubePlayer }         from '@/components/learning/YouTubePlayer';
import type { Video, Section, VideoProgress } from '@/types';
import {
  ChevronLeft, ChevronRight, Lock, Menu, X,
  CheckCircle2, ArrowLeft,
} from 'lucide-react';

export default function VideoPage() {
  const params    = useParams<{ subjectId: string; videoId: string }>();
  const router    = useRouter();
  const { user }  = useAuthStore();

  const subjectId = Number(params.subjectId);
  const videoId   = Number(params.videoId);

  const [video,       setVideo]       = useState<Video | null>(null);
  const [prev,        setPrev]        = useState<{ id: number; title: string } | null>(null);
  const [next,        setNext]        = useState<{ id: number; title: string } | null>(null);
  const [sections,    setSections]    = useState<Section[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, VideoProgress>>({});
  const [myProgress,  setMyProgress]  = useState<VideoProgress>({ last_position_seconds: 0, is_completed: false });
  const [enrolled,    setEnrolled]    = useState(false);
  const [isUnlocked,  setIsUnlocked]  = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [percent,     setPercent]     = useState(0);
  const isMounted = useRef(true);

  /* ── load everything ────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!user) { router.push(`/subjects/${subjectId}`); return; }
    setLoading(true);
    try {
      const [videoRes, treeRes, subjRes] = await Promise.all([
        videoApi.get(videoId),
        subjectApi.tree(subjectId),
        subjectApi.get(subjectId),
      ]);

      if (!isMounted.current) return;

      setVideo(videoRes.data.video);
      setPrev(videoRes.data.prev);
      setNext(videoRes.data.next);
      setSections(treeRes.data.tree);
      setEnrolled(subjRes.data.enrolled);

      // build progress map for enrolled users
      if (subjRes.data.enrolled) {
        const allVideos: Video[] = treeRes.data.tree.flatMap((s: Section) => s.videos);
        const progResults = await Promise.all(
          allVideos.map((v) => progressApi.getVideo(v.id).then((r) => ({ id: v.id, ...r.data })))
        );
        const map: Record<number, VideoProgress> = {};
        progResults.forEach(({ id, ...rest }) => { map[id] = rest as VideoProgress; });
        setProgressMap(map);

        // my progress for this video
        const mine = map[videoId] ?? { last_position_seconds: 0, is_completed: false };
        setMyProgress(mine);

        // unlock check: first video OR prev is completed
        const idx = allVideos.findIndex((v) => v.id === videoId);
        const unlocked =
          idx === 0 ||
          (idx > 0 && (map[allVideos[idx - 1].id]?.is_completed ?? false));
        setIsUnlocked(unlocked);

        // subject percent
        const subjProg = await progressApi.getSubject(subjectId);
        setPercent(subjProg.data.percent);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user, videoId, subjectId, router]);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => { isMounted.current = false; };
  }, [load]);

  const onComplete = useCallback(() => {
    setMyProgress((p) => ({ ...p, is_completed: true }));
    setProgressMap((m) => ({ ...m, [videoId]: { ...m[videoId], is_completed: true } }));
    load(); // refresh progress
  }, [videoId, load]);

  /* ── loading skeleton ───────────────────────────────────── */
  if (loading) return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 p-6 space-y-4">
        <div className="skeleton aspect-video rounded-xl w-full" />
        <div className="skeleton h-7 w-2/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
      </div>
      <div className="w-72 border-l border-ink-100 p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-10 rounded" />
        ))}
      </div>
    </div>
  );

  if (!video) return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <div className="text-center">
        <p className="text-ink-500">Video not found.</p>
        <Link href={`/subjects/${subjectId}`} className="btn-outline mt-4 inline-flex">← Back</Link>
      </div>
    </div>
  );

  const ytId = video.youtube_video_id;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* ── main player area ── */}
      <div className="flex-1 overflow-y-auto bg-sand-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* back link */}
          <Link href={`/subjects/${subjectId}`}
            className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-800">
            <ArrowLeft size={12} /> Back to subject
          </Link>

          {/* player or locked card */}
          {isUnlocked ? (
            <YouTubePlayer
              videoId={ytId}
              dbVideoId={video.id}
              startSeconds={myProgress.last_position_seconds}
              onComplete={onComplete}
            />
          ) : (
            <div className="aspect-video rounded-xl bg-ink-100 flex items-center justify-center border border-ink-200">
              <div className="text-center p-8">
                <div className="w-14 h-14 rounded-full bg-ink-200 flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-ink-500" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink-800 mb-1">Lesson locked</h3>
                <p className="text-sm text-ink-500">Complete the previous lesson to unlock this one.</p>
                {prev && (
                  <Link href={`/subjects/${subjectId}/video/${prev.id}`}
                    className="btn-outline mt-4 inline-flex text-sm">
                    ← Go to previous lesson
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* title + progress */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink-900 leading-tight">
                  {video.title}
                </h1>
                {myProgress.is_completed && (
                  <span className="inline-flex items-center gap-1.5 mt-2 text-xs text-sage font-medium">
                    <CheckCircle2 size={13} /> Completed
                  </span>
                )}
              </div>
              {/* mobile sidebar toggle */}
              <button
                className="lg:hidden btn-ghost p-2"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                <Menu size={18} />
              </button>
            </div>

            {/* subject progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5">
                <span>Subject progress</span>
                <span className="font-mono font-medium text-ink-700">{percent}%</span>
              </div>
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* description */}
          {video.description && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-ink-800 mb-2">About this lesson</h2>
              <p className="text-sm text-ink-600 leading-relaxed">{video.description}</p>
            </div>
          )}

          {/* prev / next nav */}
          <div className="flex gap-3 pt-2 pb-8">
            {prev ? (
              <Link href={`/subjects/${subjectId}/video/${prev.id}`}
                className="btn-outline flex-1 text-sm justify-start gap-2 truncate">
                <ChevronLeft size={15} className="flex-shrink-0" />
                <span className="truncate">{prev.title}</span>
              </Link>
            ) : <div className="flex-1" />}

            {next && (
              <Link href={`/subjects/${subjectId}/video/${next.id}`}
                className="btn-primary flex-1 text-sm justify-end gap-2 truncate">
                <span className="truncate">{next.title}</span>
                <ChevronRight size={15} className="flex-shrink-0" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── desktop sidebar ── */}
      <div className="hidden lg:flex w-72 xl:w-80 flex-shrink-0 h-full">
        <LearningSidebar
          sections={sections}
          currentVideoId={videoId}
          subjectId={subjectId}
          progressMap={progressMap}
          enrolled={enrolled}
        />
      </div>

      {/* ── mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative ml-auto w-80 h-full animate-slide-in-r">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/80 hover:bg-white"
            >
              <X size={15} />
            </button>
            <LearningSidebar
              sections={sections}
              currentVideoId={videoId}
              subjectId={subjectId}
              progressMap={progressMap}
              enrolled={enrolled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
