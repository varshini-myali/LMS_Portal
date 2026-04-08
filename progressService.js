// src/services/progressService.js
const db = require('../config/database');

/**
 * getSubjectProgress – returns percent complete, total/completed videos,
 * and the last-watched video id for a user+subject.
 */
async function getSubjectProgress(userId, subjectId) {
  const [[stats]] = await db.query(`
    SELECT
      COUNT(v.id)                                           AS total_videos,
      COUNT(vp.id)                                          AS started_videos,
      SUM(CASE WHEN vp.is_completed = 1 THEN 1 ELSE 0 END) AS completed_videos
    FROM videos v
    LEFT JOIN video_progress vp ON vp.video_id = v.id AND vp.user_id = ?
    WHERE v.subject_id = ?
  `, [userId, subjectId]);

  const [[lastRow]] = await db.query(`
    SELECT vp.video_id
    FROM video_progress vp
    JOIN videos v ON v.id = vp.video_id
    WHERE vp.user_id = ? AND v.subject_id = ?
    ORDER BY vp.updated_at DESC LIMIT 1
  `, [userId, subjectId]);

  const total     = stats.total_videos     || 0;
  const completed = stats.completed_videos || 0;
  const percent   = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total_videos:     total,
    completed_videos: completed,
    percent,
    last_video_id:    lastRow?.video_id || null,
  };
}

/**
 * getVideoProgress – last position + completion for one video.
 */
async function getVideoProgress(userId, videoId) {
  const [[row]] = await db.query(
    'SELECT * FROM video_progress WHERE user_id = ? AND video_id = ?',
    [userId, videoId]
  );
  return row || { last_position_seconds: 0, is_completed: false };
}

/**
 * saveVideoProgress – upsert progress, auto-complete when within 10 s of end.
 */
async function saveVideoProgress(userId, videoId, { last_position_seconds, is_completed }) {
  // fetch video duration for auto-complete detection
  const [[video]] = await db.query('SELECT duration_seconds FROM videos WHERE id = ?', [videoId]);
  const duration  = video?.duration_seconds || 0;

  const autoComplete = is_completed ||
    (duration > 0 && last_position_seconds >= duration - 10);

  await db.query(`
    INSERT INTO video_progress (user_id, video_id, last_position_seconds, is_completed, completed_at)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      last_position_seconds = VALUES(last_position_seconds),
      is_completed          = GREATEST(is_completed, VALUES(is_completed)),
      completed_at          = IF(VALUES(is_completed) = 1 AND completed_at IS NULL, NOW(), completed_at),
      updated_at            = NOW()
  `, [
    userId, videoId,
    last_position_seconds,
    autoComplete ? 1 : 0,
    autoComplete ? new Date() : null,
  ]);

  return { last_position_seconds, is_completed: autoComplete };
}

/**
 * isVideoUnlocked – strict sequential lock logic.
 * A video is unlocked if:
 *   - it has global_order = 1 (first in subject), OR
 *   - the video with global_order = (this - 1) has is_completed = true for this user.
 */
async function isVideoUnlocked(userId, video) {
  if (video.global_order <= 1) return true;

  const [[prev]] = await db.query(
    'SELECT id FROM videos WHERE subject_id = ? AND global_order = ?',
    [video.subject_id, video.global_order - 1]
  );
  if (!prev) return true;

  const [[prog]] = await db.query(
    'SELECT is_completed FROM video_progress WHERE user_id = ? AND video_id = ?',
    [userId, prev.id]
  );
  return prog?.is_completed === 1;
}

module.exports = { getSubjectProgress, getVideoProgress, saveVideoProgress, isVideoUnlocked };
