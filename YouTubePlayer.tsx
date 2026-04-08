'use client';
// src/components/learning/YouTubePlayer.tsx
import { useEffect, useRef, useCallback } from 'react';
import { progressApi } from '@/lib/api';

interface YouTubePlayerProps {
  videoId:       string;  // YT video id
  dbVideoId:     number;  // our DB id
  startSeconds?: number;
  onComplete?:   () => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  getDuration:    () => number;
  seekTo:         (s: number, allowSeek: boolean) => void;
  destroy:        () => void;
}

const SAVE_INTERVAL_MS = 10_000; // save every 10 s

export function YouTubePlayer({ videoId, dbVideoId, startSeconds = 0, onComplete }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef    = useRef<YTPlayer | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef     = useRef(startSeconds);
  const completedRef = useRef(false);

  const saveProgress = useCallback(async (completed = false) => {
    if (!playerRef.current) return;
    const pos = Math.floor(playerRef.current.getCurrentTime());
    try {
      await progressApi.saveVideo(dbVideoId, {
        last_position_seconds: pos,
        is_completed: completed,
      });
      if (completed && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    } catch { /* swallow */ }
  }, [dbVideoId, onComplete]);

  useEffect(() => {
    let player: YTPlayer;

    const initPlayer = () => {
      if (!containerRef.current) return;
      player = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          start: Math.floor(startRef.current),
        },
        events: {
          onStateChange: (ev: { data: number }) => {
            const { ENDED, PLAYING, PAUSED } = window.YT.PlayerState;
            if (ev.data === ENDED) {
              if (timerRef.current) clearInterval(timerRef.current);
              saveProgress(true);
            } else if (ev.data === PLAYING) {
              timerRef.current = setInterval(() => saveProgress(false), SAVE_INTERVAL_MS);
            } else if (ev.data === PAUSED) {
              if (timerRef.current) clearInterval(timerRef.current);
              saveProgress(false);
            }
          },
        },
      });
      playerRef.current = player;
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      // inject API script once
      if (!document.getElementById('yt-api-script')) {
        const script = document.createElement('script');
        script.id  = 'yt-api-script';
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try { player?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, [videoId, saveProgress]);

  return (
    <div className="yt-embed rounded-xl overflow-hidden shadow-lg">
      <div ref={containerRef} />
    </div>
  );
}
