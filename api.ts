// src/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

// attach stored access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lms_at');
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// silent refresh on 401
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const orig = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (err.response?.status === 401 && !orig._retry && !orig.url?.includes('/auth/')) {
      orig._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post<{ accessToken: string }>('/auth/refresh')
            .then((res) => {
              const t = res.data.accessToken;
              localStorage.setItem('lms_at', t);
              refreshPromise = null;
              return t;
            })
            .catch((e) => { refreshPromise = null; localStorage.removeItem('lms_at'); throw e; });
        }
        const newToken = await refreshPromise;
        orig.headers = orig.headers ?? {};
        orig.headers.Authorization = `Bearer ${newToken}`;
        return api(orig);
      } catch { /* fallthrough */ }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (d: { name: string; email: string; password: string }) => api.post('/auth/register', d),
  login:    (d: { email: string; password: string })               => api.post('/auth/login', d),
  refresh:  ()                                                      => api.post('/auth/refresh'),
  logout:   ()                                                      => api.post('/auth/logout'),
};

export const subjectApi = {
  list:       ()                => api.get('/subjects'),
  get:        (id: number)      => api.get(`/subjects/${id}`),
  tree:       (id: number)      => api.get(`/subjects/${id}/tree`),
  firstVideo: (id: number)      => api.get(`/subjects/${id}/first-video`),
};

export const videoApi = {
  get: (id: number) => api.get(`/videos/${id}`),
};

export const enrollApi = {
  enroll:   (subjectId: number) => api.post('/enrollments',        { subject_id: subjectId }),
  unenroll: (subjectId: number) => api.delete(`/enrollments/${subjectId}`),
};

export const wishlistApi = {
  add:    (subjectId: number) => api.post('/wishlist',         { subject_id: subjectId }),
  remove: (subjectId: number) => api.delete(`/wishlist/${subjectId}`),
};

export const progressApi = {
  getSubject: (subjectId: number) => api.get(`/progress/subjects/${subjectId}`),
  getVideo:   (videoId: number)   => api.get(`/progress/videos/${videoId}`),
  saveVideo:  (videoId: number, data: { last_position_seconds: number; is_completed: boolean }) =>
    api.post(`/progress/videos/${videoId}`, data),
};

export function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}
