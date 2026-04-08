// src/index.js
require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const authRoutes        = require('./routes/auth');
const subjectRoutes     = require('./routes/subjects');
const videoRoutes       = require('./routes/videos');
const enrollmentRoutes  = require('./routes/enrollments');
const wishlistRoutes    = require('./routes/wishlist');
const progressRoutes    = require('./routes/progress');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security & parsing ───────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ────────────────────────────────────────────
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, message: { error: 'Too many requests' } });
const apiLimiter  = rateLimit({ windowMs: 60_000, max: 200 });

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',        authLimiter, authRoutes);
app.use('/api/subjects',    apiLimiter,  subjectRoutes);
app.use('/api/videos',      apiLimiter,  videoRoutes);
app.use('/api/enrollments', apiLimiter,  enrollmentRoutes);
app.use('/api/wishlist',    apiLimiter,  wishlistRoutes);
app.use('/api/progress',    apiLimiter,  progressRoutes);

// ── Health ───────────────────────────────────────────────────
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString(), env: process.env.NODE_ENV })
);

// ── 404 / error handler ──────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`🚀  LMS API running on http://localhost:${PORT}`));
