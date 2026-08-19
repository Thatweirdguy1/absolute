use sqlx::{SqlitePool, Row};
use uuid::Uuid;
use crate::models::LocalProfile;
use crate::error::AppResult;
use crate::services::letterboxd;

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
    pool: tauri::State<'_, SqlitePool>
) -> Result<usize, String> {
    let rows = letterboxd::parse_diary_csv(&file_path).map_err(|e| e.to_string())?;
    
    // In a real flow, this triggers the persistent background job queue 
    // to resolve TMDB matches and store raw history progressively.
    
    Ok(rows.len())
}
