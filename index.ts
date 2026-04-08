// src/types/index.ts

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  avatar_url?: string;
}

export interface Subject {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  description?: string;
  thumbnail_url?: string;
  what_you_learn?: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  instructor_name: string;
  instructor_avatar?: string;
  enrollment_count: number;
  video_count: number;
  total_duration: number;
}

export interface Section {
  id: number;
  subject_id: number;
  title: string;
  order_index: number;
  videos: Video[];
}

export interface Video {
  id: number;
  section_id: number;
  subject_id: number;
  title: string;
  description?: string;
  youtube_url: string;
  youtube_video_id: string;
  duration_seconds: number;
  order_index: number;
  global_order: number;
}

export interface VideoProgress {
  last_position_seconds: number;
  is_completed: boolean;
}

export interface SubjectProgress {
  total_videos: number;
  completed_videos: number;
  percent: number;
  last_video_id: number | null;
}
