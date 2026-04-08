// src/routes/subjects.js
const express    = require('express');
const subjectSvc = require('../services/subjectService');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const db         = require('../config/database');
const router     = express.Router();

// GET /api/subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await subjectSvc.listSubjects();
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subjects/:subjectId
router.get('/:subjectId', optionalAuth, async (req, res) => {
  try {
    const subject = await subjectSvc.getSubject(req.params.subjectId);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    // If authenticated, also return enrollment/wishlist status
    let enrolled = false, wishlisted = false;
    if (req.user) {
      const [[enr]] = await db.query(
        'SELECT id FROM enrollments WHERE user_id = ? AND subject_id = ?',
        [req.user.id, subject.id]
      );
      const [[wsh]] = await db.query(
        'SELECT id FROM wishlist WHERE user_id = ? AND subject_id = ?',
        [req.user.id, subject.id]
      );
      enrolled   = !!enr;
      wishlisted = !!wsh;
    }

    res.json({ subject, enrolled, wishlisted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subjects/:subjectId/tree
router.get('/:subjectId/tree', async (req, res) => {
  try {
    const tree = await subjectSvc.getSubjectTree(req.params.subjectId);
    res.json({ tree });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subjects/:subjectId/first-video
router.get('/:subjectId/first-video', async (req, res) => {
  try {
    const video = await subjectSvc.getFirstVideo(req.params.subjectId);
    if (!video) return res.status(404).json({ error: 'No videos found' });
    res.json({ video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
