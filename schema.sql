-- ============================================================
-- LMS Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS lms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lms_db;

-- Users
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  avatar_url  VARCHAR(500)  NULL,
  role        ENUM('student','instructor','admin') NOT NULL DEFAULT 'student',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subjects (courses)
CREATE TABLE subjects (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  instructor_id     INT UNSIGNED NOT NULL,
  title             VARCHAR(200) NOT NULL,
  slug              VARCHAR(220) NOT NULL UNIQUE,
  short_description VARCHAR(400) NOT NULL,
  description       TEXT         NULL,
  thumbnail_url     VARCHAR(500) NULL,
  what_you_learn    JSON         NULL,   -- array of strings
  level             ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  language          VARCHAR(60)  NOT NULL DEFAULT 'English',
  is_published      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Sections (chapters inside a subject)
CREATE TABLE sections (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_id   INT UNSIGNED NOT NULL,
  title        VARCHAR(200) NOT NULL,
  order_index  INT UNSIGNED NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_section_order (subject_id, order_index),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Videos (lessons inside a section)
CREATE TABLE videos (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_id       INT UNSIGNED NOT NULL,
  subject_id       INT UNSIGNED NOT NULL,  -- denormalized for fast queries
  title            VARCHAR(300) NOT NULL,
  description      TEXT         NULL,
  youtube_url      VARCHAR(500) NOT NULL,
  youtube_video_id VARCHAR(20)  NOT NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  order_index      INT UNSIGNED NOT NULL,  -- unique within section
  global_order     INT UNSIGNED NOT NULL,  -- unique within subject (for lock logic)
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_video_order     (section_id, order_index),
  UNIQUE KEY uq_video_global    (subject_id, global_order),
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Enrollments
CREATE TABLE enrollments (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  subject_id   INT UNSIGNED NOT NULL,
  enrolled_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enrollment (user_id, subject_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Wishlist
CREATE TABLE wishlist (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  subject_id   INT UNSIGNED NOT NULL,
  added_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist (user_id, subject_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Per-user video progress
CREATE TABLE video_progress (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id               INT UNSIGNED NOT NULL,
  video_id              INT UNSIGNED NOT NULL,
  last_position_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  is_completed          TINYINT(1)   NOT NULL DEFAULT 0,
  completed_at          DATETIME     NULL,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progress (user_id, video_id),
  FOREIGN KEY (user_id)  REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id)  ON DELETE CASCADE
);

-- Refresh tokens (enables revocation)
CREATE TABLE refresh_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,  -- SHA-256 of the raw token
  expires_at DATETIME     NOT NULL,
  revoked    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Seed data (demo)
-- ============================================================

INSERT INTO users (name, email, password, role) VALUES
('Alice Chen',     'alice@lms.dev',   '$2b$12$placeholder_hash_alice',   'instructor'),
('Bob Martinez',   'bob@lms.dev',     '$2b$12$placeholder_hash_bob',     'instructor'),
('Carol Student',  'carol@lms.dev',   '$2b$12$placeholder_hash_carol',   'student');

INSERT INTO subjects (instructor_id, title, slug, short_description, description, level, what_you_learn, is_published) VALUES
(1, 'Modern JavaScript Mastery', 'modern-javascript-mastery',
 'Go from zero to hero with ES2024, async patterns, and real-world projects.',
 'A comprehensive deep-dive into modern JavaScript covering closures, prototypes, async/await, modules, and advanced patterns used in production codebases.',
 'intermediate',
 '["Closures & scope chains","Async/await & Promises","ES modules & bundling","Functional programming patterns","Real-world project architecture"]',
 1),
(2, 'React & Next.js in Production', 'react-nextjs-production',
 'Build, optimize, and ship full-stack React apps with Next.js 14 App Router.',
 'Learn how to architect large-scale React applications with Next.js 14, covering Server Components, streaming, caching strategies, and deployment.',
 'advanced',
 '["App Router & Server Components","Data fetching patterns","Auth with JWT","Deployment & performance","Testing strategies"]',
 1),
(1, 'CSS Mastery: From Basics to Art', 'css-mastery-basics-to-art',
 'Master CSS layout, animations, and design systems with hands-on projects.',
 'A thorough exploration of modern CSS: Flexbox, Grid, custom properties, animations, and building scalable design systems.',
 'beginner',
 '["Flexbox & CSS Grid","Custom properties","Keyframe animations","Design tokens","Responsive design systems"]',
 1);
