-- SQLite WAL and foreign key settings should be set per connection
-- Phase 1 Initial Schema

CREATE TABLE local_profiles (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    username TEXT,
    avatar_path TEXT,
    timezone TEXT,
    onboarding_state TEXT NOT NULL DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profile_preferences (
    profile_id TEXT PRIMARY KEY REFERENCES local_profiles(id) ON DELETE CASCADE,
    rating_display TEXT DEFAULT 'half_stars',
    theme TEXT DEFAULT 'dark',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media (
    internal_id TEXT PRIMARY KEY, -- e.g. "movie:12345"
    tmdb_id INTEGER,
    media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
    title TEXT NOT NULL,
    original_title TEXT,
    overview TEXT,
    status TEXT,
    original_language TEXT,
    release_date DATE,
    release_year INTEGER,
    runtime INTEGER,
    poster_path TEXT,
    backdrop_path TEXT,
    tmdb_vote_average REAL,
    tmdb_vote_count INTEGER,
    imdb_id TEXT,
    metadata_completeness INTEGER DEFAULT 0,
    fetched_at DATETIME,
    UNIQUE(tmdb_id, media_type)
);

CREATE TABLE seen_records (
    id TEXT PRIMARY KEY,
    profile_id TEXT REFERENCES local_profiles(id) ON DELETE CASCADE,
    media_id TEXT REFERENCES media(internal_id) ON DELETE CASCADE,
    source_assertion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, media_id)
);

CREATE TABLE watch_events (
    id TEXT PRIMARY KEY,
    profile_id TEXT REFERENCES local_profiles(id) ON DELETE CASCADE,
    media_id TEXT REFERENCES media(internal_id) ON DELETE CASCADE,
    watched_date DATE,
    is_rewatch BOOLEAN DEFAULT FALSE,
    source_uri TEXT,
    import_row_id TEXT,
    event_fingerprint TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_ratings (
    id TEXT PRIMARY KEY,
    profile_id TEXT REFERENCES local_profiles(id) ON DELETE CASCADE,
    media_id TEXT REFERENCES media(internal_id) ON DELETE CASCADE,
    rating_value INTEGER NOT NULL, -- half-star steps (e.g. 9 for 4.5 stars)
    rated_date DATE,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, media_id)
);

CREATE TABLE import_batches (
    id TEXT PRIMARY KEY,
    profile_id TEXT REFERENCES local_profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    total_count INTEGER DEFAULT 0,
    matched_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME
);
