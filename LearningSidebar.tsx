'use client';
// src/components/learning/LearningSidebar.tsx
import Link           from 'next/link';
import { clsx }       from 'clsx';
import type { Section, Video, VideoProgress } from '@/types';
import { CheckCircle2, Lock, Circle, PlayCircle, ChevronDown } from 'lucide-react';
import { useState }   from 'react';
import { fmtDuration } from '@/lib/api';

interface SidebarProps {
  sections:    Section[];
  currentVideoId: number;
  subjectId:   number;
  progressMap: Record<number, VideoProgress>;
  enrolled:    boolean;
}

function videoIcon(
  video: Video,
  isCurrentVideo: boolean,
  progress: VideoProgress | undefined,
  isUnlocked: boolean,
) {
  if (!isUnlocked)           return <Lock     size={14} className="text-ink-300 flex-shrink-0" />;
  if (progress?.is_completed) return <CheckCircle2 size={14} className="text-sage flex-shrink-0" />;
  if (isCurrentVideo)        return <PlayCircle size={14} className="text-accent flex-shrink-0" />;
  return <Circle size={14} className="text-ink-300 flex-shrink-0" />;
}

export function LearningSidebar({
  sections, currentVideoId, subjectId, progressMap, enrolled,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  // build global ordering to compute unlock
  const allVideos: Video[] = sections.flatMap((s) => s.videos);
  const unlockedIds = new Set<number>();
  for (let i = 0; i < allVideos.length; i++) {
    const v = allVideos[i];
    if (i === 0) { unlockedIds.add(v.id); continue; }
    const prev = allVideos[i - 1];
    if (progressMap[prev.id]?.is_completed) unlockedIds.add(v.id);
  }

  const toggleSection = (id: number) =>
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <aside className="h-full flex flex-col bg-white border-l border-ink-100">
      {/* header */}
      <div className="px-4 py-4 border-b border-ink-100">
        <h3 className="font-display text-sm font-semibold text-ink-900">Course content</h3>
        <p className="text-xs text-ink-500 mt-0.5">
          {allVideos.length} lessons · {Object.values(progressMap).filter((p) => p.is_completed).length} completed
        </p>
      </div>

      {/* scrollable list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sections.map((section) => {
          const isOpen = !collapsed[section.id];
          return (
            <div key={section.id} className="border-b border-ink-50">
              {/* section header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-3
                           hover:bg-sand-100 transition-colors text-left group"
              >
                <span className="text-xs font-semibold text-ink-700 group-hover:text-ink-900 uppercase tracking-wide leading-tight">
                  {section.title}
                </span>
                <ChevronDown
                  size={13}
                  className={clsx(
                    'text-ink-400 flex-shrink-0 transition-transform duration-200',
                    !isOpen && '-rotate-90'
                  )}
                />
              </button>

              {/* videos */}
              {isOpen && (
                <ul className="pb-1">
                  {section.videos.map((video) => {
                    const isCurrent  = video.id === currentVideoId;
                    const progress   = progressMap[video.id];
                    const isUnlocked = enrolled ? unlockedIds.has(video.id) : false;

                    return (
                      <li key={video.id}>
                        {isUnlocked ? (
                          <Link
                            href={`/subjects/${subjectId}/video/${video.id}`}
                            className={clsx(
                              'flex items-start gap-2.5 px-4 py-2.5 text-left transition-colors',
                              isCurrent
                                ? 'bg-accent-50 border-r-2 border-accent'
                                : 'hover:bg-sand-100'
                            )}
                          >
                            <div className="mt-0.5">
                              {videoIcon(video, isCurrent, progress, isUnlocked)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={clsx(
                                'text-xs leading-snug truncate',
                                isCurrent ? 'font-semibold text-accent-700' : 'font-medium text-ink-800',
                                progress?.is_completed && !isCurrent && 'text-ink-500'
                              )}>
                                {video.title}
                              </p>
                              <p className="text-[10px] text-ink-400 mt-0.5 font-mono">
                                {fmtDuration(video.duration_seconds)}
                              </p>
                            </div>
                            {progress?.is_completed && !isCurrent && (
                              <div className="w-1 h-1 rounded-full bg-sage mt-1.5 flex-shrink-0" />
                            )}
                          </Link>
                        ) : (
                          <div className="flex items-start gap-2.5 px-4 py-2.5 opacity-50 cursor-not-allowed">
                            <div className="mt-0.5">
                              {videoIcon(video, false, undefined, false)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-ink-500 leading-snug truncate">
                                {video.title}
                              </p>
                              <p className="text-[10px] text-ink-400 mt-0.5 font-mono">
                                {fmtDuration(video.duration_seconds)}
                              </p>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
