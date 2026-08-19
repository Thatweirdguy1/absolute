use sqlx::{SqlitePool, Row};
use uuid::Uuid;
use crate::models::LocalProfile;
use crate::error::AppResult;
use crate::services::letterboxd;
use serde::Serialize;

#[tauri::command]
pub async fn get_profile(pool: tauri::State<'_, SqlitePool>) -> Result<Option<LocalProfile>, String> {
    sqlx::query_as::<_, LocalProfile>(
        "SELECT id, display_name, username, avatar_path, timezone, onboarding_state, created_at, updated_at FROM local_profiles LIMIT 1"
    )
    .fetch_optional(&*pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_profile(
    display_name: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<LocalProfile, String> {
    let id = Uuid::new_v4().to_string();
    let timezone = Some("UTC".to_string());

    sqlx::query(
        "INSERT INTO local_profiles (id, display_name, timezone, onboarding_state) VALUES (?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&display_name)
    .bind(&timezone)
    .bind("new")
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let profile = LocalProfile {
        id,
        display_name,
        username: None,
        avatar_path: None,
        timezone,
        onboarding_state: "new".to_string(),
        created_at: None,
        updated_at: None,
    };

    Ok(profile)
}

#[tauri::command]
pub async fn import_letterboxd_csv(
    file_path: String,
    _pool: tauri::State<'_, SqlitePool>
) -> Result<usize, String> {
    let rows = letterboxd::parse_diary_csv(&file_path).map_err(|e| e.to_string())?;
    
    // In a real flow, this triggers the persistent background job queue 
    // to resolve TMDB matches and store raw history progressively.
    
    Ok(rows.len())
}

#[derive(Serialize)]
pub struct DashboardStats {
    pub total_films: i64,
    pub total_hours: i64,
    pub avg_rating: f64,
}

#[tauri::command]
pub async fn get_dashboard_stats(pool: tauri::State<'_, SqlitePool>) -> Result<DashboardStats, String> {
    // A real implementation would sum runtime from joined media/watch_events tables
    // For now, we fetch the counts from the DB to prove end-to-end SQLite connectivity
    
    let films_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM watch_events"
    )
    .fetch_one(&*pool)
    .await
    .unwrap_or(0);

    let avg_rating: f64 = sqlx::query_scalar(
        "SELECT AVG(rating_value) FROM user_ratings"
    )
    .fetch_one(&*pool)
    .await
    .unwrap_or(0.0);

    // Default to some derived data if empty to show the UI
    Ok(DashboardStats {
        total_films: if films_count > 0 { films_count } else { 0 },
        total_hours: if films_count > 0 { films_count * 2 } else { 0 }, // Rough estimate for now
        avg_rating: if avg_rating > 0.0 { avg_rating / 2.0 } else { 0.0 }, // Convert out of 10 to out of 5
    })
}
