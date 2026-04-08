// src/routes/enrollments.js
const express    = require('express');
const db         = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const router     = express.Router();

// GET /api/enrollments/mine
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.id, s.title, s.slug, s.short_description, s.thumbnail_url, s.level, s.language,
        u.name AS instructor_name,
        COUNT(DISTINCT v.id) AS video_count,
        COALESCE(SUM(v.duration_seconds), 0) AS total_duration,
        COUNT(DISTINCT e2.user_id) AS enrollment_count
      FROM enrollments e
      JOIN subjects s ON s.id = e.subject_id
      JOIN users    u ON u.id = s.instructor_id
      LEFT JOIN sections  sec ON sec.subject_id = s.id
      LEFT JOIN videos    v   ON v.section_id   = sec.id
      LEFT JOIN enrollments e2 ON e2.subject_id = s.id
      WHERE e.user_id = ?
      GROUP BY s.id
      ORDER BY e.enrolled_at DESC
    `, [req.user.id]);
    res.json({ subjects: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enrollments
router.post('/', requireAuth, async (req, res) => {
  const { subject_id } = req.body;
  if (!subject_id) return res.status(422).json({ error: 'subject_id required' });

  try {
    await db.query(
      'INSERT IGNORE INTO enrollments (user_id, subject_id) VALUES (?, ?)',
      [req.user.id, subject_id]
    );
    res.status(201).json({ enrolled: true, subject_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/enrollments/:subjectId
router.delete('/:subjectId', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM enrollments WHERE user_id = ? AND subject_id = ?',
      [req.user.id, req.params.subjectId]);
    res.json({ enrolled: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
