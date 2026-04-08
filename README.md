# Lumen LMS — Full-Stack Learning Management System

> Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS / Node.js + Express + MySQL

---

## Project Structure

```
lms/
├── backend/
│   ├── schema.sql              DB schema + seed data
│   ├── .env.example
│   └── src/
│       ├── index.js            Express entry, middleware wiring
│       ├── config/database.js  mysql2 pool
│       ├── middleware/auth.js  requireAuth / optionalAuth / requireRole
│       ├── routes/             auth · subjects · videos · enrollments · wishlist · progress
│       └── services/           authService · subjectService · progressService
│
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx                               Root layout + TopNav
        │   ├── page.tsx                                 / subjects list
        │   ├── auth/login/page.tsx
        │   ├── auth/register/page.tsx
        │   ├── subjects/[subjectId]/page.tsx            Subject detail + Enrol/Wishlist
        │   ├── subjects/[subjectId]/video/[videoId]/page.tsx  Learning view
        │   └── profile/page.tsx
        ├── components/
        │   ├── auth/AuthProvider.tsx   hydrates JWT on mount
        │   ├── auth/AuthModal.tsx      inline login/register modal
        │   ├── ui/TopNav.tsx
        │   ├── learning/YouTubePlayer.tsx   IFrame API + progress sync
        │   └── learning/LearningSidebar.tsx timeline sidebar
        ├── store/auth.ts        Zustand auth state
        ├── lib/api.ts           Axios instance + typed API helpers
        └── types/index.ts
```

---

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env        # fill DB creds + JWT_SECRET
npm install
mysql -u root -p < schema.sql
npm run dev                  # http://localhost:4000
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                  # http://localhost:3000
```

---

## Authentication Flow

```
Register/Login
  -> bcrypt verify password
  -> JWT access token (15 min) returned in JSON body
  -> Refresh token (64 random bytes, SHA-256 hash stored in DB, 30 days)
     set as HTTP-only cookie on /api/auth

Client: store access token in localStorage as "lms_at"
Axios interceptor: inject Authorization: Bearer <lms_at> on every request

On 401 -> Axios interceptor:
  -> POST /api/auth/refresh (cookie sent automatically)
  -> New access token -> retry original request

Logout -> revoke refresh token row -> clear cookie
```

Refresh tokens are **rotated** on every use (old token revoked, new one issued).

---

## Lock / Progress Logic (end-to-end)

### Backend (progressService.js)

A video is unlocked if:
- It has `global_order = 1` (first in the subject), OR
- The video with `global_order - 1` has `is_completed = 1` for this user

`saveVideoProgress` auto-marks complete when `last_position >= duration - 10s`.

### Frontend (video/[videoId]/page.tsx)

1. Load full progress map for the subject on page mount
2. Walk `allVideos` sorted by `global_order`
3. Video at index i is unlocked iff `i===0 || progressMap[allVideos[i-1].id].is_completed`
4. If locked -> render "Complete previous lesson" card, do NOT mount the player
5. YouTubePlayer uses IFrame API:
   - PLAYING  -> 10s interval -> POST /api/progress/videos/:id
   - PAUSED   -> final save
   - ENDED    -> save with is_completed:true -> onComplete() callback
6. onComplete() refreshes progressMap, sidebar updates immediately

---

## API Reference

### Auth
POST /api/auth/register    { name, email, password } -> { user, accessToken }
POST /api/auth/login       { email, password }       -> { user, accessToken }
POST /api/auth/refresh     (cookie)                  -> { user, accessToken }
POST /api/auth/logout      (cookie)                  -> { message }

### Subjects
GET  /api/subjects                  list all published
GET  /api/subjects/:id              detail + enrolled/wishlisted flags
GET  /api/subjects/:id/tree         full section->video tree
GET  /api/subjects/:id/first-video  lowest global_order video

### Videos
GET  /api/videos/:id    video + prev/next

### Enrollment & Wishlist
POST   /api/enrollments         { subject_id }
DELETE /api/enrollments/:id
POST   /api/wishlist            { subject_id }
DELETE /api/wishlist/:id

### Progress
GET  /api/progress/subjects/:id    percent + last_video_id
GET  /api/progress/videos/:id      last_position + is_completed
POST /api/progress/videos/:id      { last_position_seconds, is_completed }

### Health
GET  /api/health

---

## Design System

Fonts    : Playfair Display (headings) + DM Sans (body) + DM Mono
Colors   : ink-900 #0f0f0f · accent #e85d26 · sage #4a7c6a · sand-100 #faf8f4
Layout   : numbered subject rows (not grid), sticky CTA card, timeline sidebar
Sidebar  : PlayCircle=current, CheckCircle2=done, Lock=locked, Circle=pending

---

## Production Checklist

- Set COOKIE_SECURE=true (HTTPS only)
- Strong JWT_SECRET (32+ chars)
- MySQL SSL connection
- NEXT_PUBLIC_API_URL in deployment env
- Prune cron: DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = 1
- Tighten CORS origin to production domain
