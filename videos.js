// src/routes/videos.js
const express = require('express');
const db      = require('../config/database');
const router  = express.Router();

// GET /api/videos/:videoId
router.get('/:videoId', async (req, res) => {
  try {
    const [[video]] = await db.query('SELECT * FROM videos WHERE id = ?', [req.params.videoId]);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // prev / next in the subject
    const [[prev]] = await db.query(
      'SELECT id, title FROM videos WHERE subject_id = ? AND global_order < ? ORDER BY global_order DESC LIMIT 1',
      [video.subject_id, video.global_order]
    );
    const [[next]] = await db.query(
      'SELECT id, title FROM videos WHERE subject_id = ? AND global_order > ? ORDER BY global_order ASC LIMIT 1',
      [video.subject_id, video.global_order]
    );

    res.json({ video, prev: prev || null, next: next || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
