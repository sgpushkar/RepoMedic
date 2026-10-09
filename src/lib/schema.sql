CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  github_id BIGINT UNIQUE NOT NULL,
  login TEXT NOT NULL,
  name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  html_url TEXT DEFAULT '',
  public_repos INT DEFAULT 0,
  followers INT DEFAULT 0,
  access_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  branch TEXT DEFAULT 'main',
  status TEXT DEFAULT 'pending',
  step TEXT DEFAULT 'Queued',
  progress INT DEFAULT 0,
  error TEXT DEFAULT NULL,
  analysis_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_id BIGINT DEFAULT 0,
  repo_name TEXT,
  repo_full_name TEXT,
  branch TEXT DEFAULT 'main',
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  duration INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  job_step TEXT DEFAULT 'Queued',
  job_progress INT DEFAULT 0,
  job_error TEXT DEFAULT NULL,
  stats JSONB DEFAULT '{}'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  file_tree JSONB DEFAULT '[]'::jsonb,
  unused_files JSONB DEFAULT '[]'::jsonb,
  dependencies JSONB DEFAULT '{}'::jsonb,
  duplicates JSONB DEFAULT '[]'::jsonb,
  issues JSONB DEFAULT '[]'::jsonb,
  health_score JSONB DEFAULT '{}'::jsonb,
  organizer_suggestion JSONB DEFAULT NULL,
  ai_summary TEXT DEFAULT NULL,
  suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_analyzed_at ON analyses(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
