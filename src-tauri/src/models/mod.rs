use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct LocalProfile {
    pub id: String,
    pub display_name: String,
    pub username: Option<String>,
    pub avatar_path: Option<String>,
    pub timezone: Option<String>,
    pub onboarding_state: String,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Media {
    pub internal_id: String,
    pub tmdb_id: Option<i64>,
    pub media_type: String,
    pub title: String,
    pub original_title: Option<String>,
    pub overview: Option<String>,
    pub status: Option<String>,
    pub original_language: Option<String>,
    pub release_date: Option<NaiveDate>,
    pub release_year: Option<i32>,
    pub runtime: Option<i32>,
    pub poster_path: Option<String>,
    pub backdrop_path: Option<String>,
    pub tmdb_vote_average: Option<f64>,
    pub tmdb_vote_count: Option<i64>,
    pub imdb_id: Option<String>,
    pub metadata_completeness: Option<i32>,
    pub fetched_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct WatchEvent {
    pub id: String,
    pub profile_id: Option<String>,
    pub media_id: Option<String>,
    pub watched_date: Option<NaiveDate>,
    pub is_rewatch: Option<bool>,
    pub source_uri: Option<String>,
    pub import_row_id: Option<String>,
    pub event_fingerprint: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct ImportBatch {
    pub id: String,
    pub profile_id: Option<String>,
    pub source: String,
    pub status: String,
    pub total_count: Option<i32>,
    pub matched_count: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
}
