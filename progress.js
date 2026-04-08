// src/routes/progress.js
const express      = require('express');
const { requireAuth } = require('../middleware/auth');
const progressSvc  = require('../services/progressService');
const db           = require('../config/database');
const router       = express.Router();

// GET /api/progress/subjects/:subjectId
router.get('/subjects/:subjectId', requireAuth, async (req, res) => {
  try {
    const data = await progressSvc.getSubjectProgress(req.user.id, req.params.subjectId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/progress/videos/:videoId
router.get('/videos/:videoId', requireAuth, async (req, res) => {
  try {
    const data = await progressSvc.getVideoProgress(req.user.id, req.params.videoId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/progress/videos/:videoId
router.post('/videos/:videoId', requireAuth, async (req, res) => {
  const { last_position_seconds = 0, is_completed = false } = req.body;
  try {
    // verify user is enrolled
    const [[video]] = await db.query('SELECT subject_id FROM videos WHERE id = ?', [req.params.videoId]);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const [[enr]] = await db.query(
      'SELECT id FROM enrollments WHERE user_id = ? AND subject_id = ?',
      [req.user.id, video.subject_id]
    );
    if (!enr) return res.status(403).json({ error: 'Not enrolled in this subject' });

    const result = await progressSvc.saveVideoProgress(
      req.user.id, req.params.videoId,
      { last_position_seconds, is_completed }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
