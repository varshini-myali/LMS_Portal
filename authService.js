// src/services/authService.js
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const db       = require('../config/database');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;
const REFRESH_DAYS  = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30;

// ── helpers ──────────────────────────────────────────────────

function makeAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function makeRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function refreshExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_DAYS);
  return d;
}

// ── service methods ──────────────────────────────────────────

async function register({ name, email, password }) {
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) throw Object.assign(new Error('Email already in use'), { status: 409 });

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const [result] = await db.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashed]
  );
  const user = { id: result.insertId, email, role: 'student' };

  const rawRefresh  = makeRefreshToken();
  const accessToken = makeAccessToken(user);
  await _storeRefreshToken(user.id, rawRefresh);

  return { user: { id: user.id, name, email, role: 'student' }, accessToken, refreshToken: rawRefresh };
}

async function login({ email, password }) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!rows.length) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const user = rows[0];
  const ok   = await bcrypt.compare(password, user.password);
  if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const rawRefresh  = makeRefreshToken();
  const accessToken = makeAccessToken(user);
  await _storeRefreshToken(user.id, rawRefresh);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url },
    accessToken,
    refreshToken: rawRefresh,
  };
}

async function refresh(rawToken) {
  if (!rawToken) throw Object.assign(new Error('Refresh token missing'), { status: 401 });

  const hash = hashToken(rawToken);
  const [rows] = await db.query(
    `SELECT rt.*, u.id AS uid, u.email, u.role, u.name
     FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = ? AND rt.revoked = 0 AND rt.expires_at > NOW()`,
    [hash]
  );
  if (!rows.length) throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });

  const row  = rows[0];
  // rotate: revoke old, issue new
  await db.query('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [hash]);

  const user        = { id: row.uid, email: row.email, role: row.role };
  const rawNew      = makeRefreshToken();
  const accessToken = makeAccessToken(user);
  await _storeRefreshToken(user.id, rawNew);

  return {
    user: { id: row.uid, name: row.name, email: row.email, role: row.role },
    accessToken,
    refreshToken: rawNew,
  };
}

async function logout(rawToken) {
  if (!rawToken) return;
  const hash = hashToken(rawToken);
  await db.query('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [hash]);
}

// ── private ───────────────────────────────────────────────────

async function _storeRefreshToken(userId, raw) {
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, hashToken(raw), refreshExpiry()]
  );
}

module.exports = { register, login, refresh, logout };
