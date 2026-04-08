// src/services/subjectService.js
const db = require('../config/database');

/** List all published subjects with instructor name + stats */
async function listSubjects() {
  const [rows] = await db.query(`
    SELECT
      s.id, s.title, s.slug, s.short_description, s.thumbnail_url, s.level, s.language,
      u.name  AS instructor_name,
      u.avatar_url AS instructor_avatar,
      COUNT(DISTINCT e.user_id) AS enrollment_count,
      COUNT(DISTINCT v.id)      AS video_count,
      COALESCE(SUM(v.duration_seconds), 0) AS total_duration
    FROM subjects s
    JOIN users    u ON u.id = s.instructor_id
    LEFT JOIN enrollments e ON e.subject_id = s.id
    LEFT JOIN sections  sec ON sec.subject_id = s.id
    LEFT JOIN videos    v   ON v.section_id  = sec.id
    WHERE s.is_published = 1
    GROUP BY s.id
    ORDER BY s.id DESC
  `);
  return rows;
}

/** Single subject with full details + what_you_learn */
async function getSubject(subjectId) {
  const [[row]] = await db.query(`
    SELECT
      s.*,
      u.name AS instructor_name, u.avatar_url AS instructor_avatar,
      COUNT(DISTINCT e.user_id) AS enrollment_count,
      COUNT(DISTINCT v.id)      AS video_count,
      COALESCE(SUM(v.duration_seconds), 0) AS total_duration
    FROM subjects s
    JOIN users u ON u.id = s.instructor_id
    LEFT JOIN enrollments e ON e.subject_id = s.id
    LEFT JOIN sections  sec ON sec.subject_id = s.id
    LEFT JOIN videos    v   ON v.section_id  = sec.id
    WHERE s.id = ? AND s.is_published = 1
    GROUP BY s.id
  `, [subjectId]);
  if (!row) return null;
  if (typeof row.what_you_learn === 'string') {
    row.what_you_learn = JSON.parse(row.what_you_learn);
  }
  return row;
}

/** Full content tree: sections → videos */
async function getSubjectTree(subjectId) {
  const [sections] = await db.query(
    'SELECT * FROM sections WHERE subject_id = ? ORDER BY order_index',
    [subjectId]
  );
  const [videos] = await db.query(
    'SELECT * FROM videos WHERE subject_id = ? ORDER BY global_order',
    [subjectId]
  );

  const secMap = {};
  sections.forEach(s => { secMap[s.id] = { ...s, videos: [] }; });
  videos.forEach(v => { if (secMap[v.section_id]) secMap[v.section_id].videos.push(v); });

  return Object.values(secMap);
}

/** First video in the subject (lowest global_order) */
async function getFirstVideo(subjectId) {
  const [[row]] = await db.query(
    'SELECT * FROM videos WHERE subject_id = ? ORDER BY global_order LIMIT 1',
    [subjectId]
  );
  return row || null;
}

module.exports = { listSubjects, getSubject, getSubjectTree, getFirstVideo };

// ─────────────────────────────────────────────────────────────
// src/routes/subjects.js  (inline to keep files manageable)
// ─────────────────────────────────────────────────────────────
