use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::LocalProfile;
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
    pool: tauri::State<'_, SqlitePool>
) -> Result<usize, String> {
    let path = std::path::Path::new(&file_path);
    
    let csv_path = if path.extension().and_then(|e| e.to_str()) == Some("zip") {
        // Extract to a temp directory
        let temp_dir = std::env::temp_dir().join(Uuid::new_v4().to_string());
        std::fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
        
        crate::services::letterboxd::extract_and_parse_zip(&file_path, &temp_dir)
            .map_err(|e| format!("Failed to extract ZIP: {}", e))?;
            
        let diary_path = temp_dir.join("diary.csv");
        if !diary_path.exists() {
            return Err("diary.csv not found inside the uploaded ZIP archive.".to_string());
        }
        diary_path
    } else {
        path.to_path_buf()
    };

    // Use flexible parsing to handle missing fields if any
    let mut rdr = csv::ReaderBuilder::new()
        .flexible(true)
        .from_path(&csv_path)
        .map_err(|e| format!("Failed to open CSV: {}", e))?;
        
    let mut rows = Vec::new();
    for result in rdr.deserialize() {
        let record: crate::services::letterboxd::DiaryRow = result.map_err(|e| e.to_string())?;
        rows.push(record);
    }
    
    let batch_id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO import_batches (id, source, status, total_count) VALUES (?, ?, ?, ?)"
    )
    .bind(&batch_id)
    .bind("letterboxd_diary")
    .bind("completed")
    .bind(rows.len() as i32)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    for row in &rows {
        let media_id = format!("lbx:{}", row.name.to_lowercase().replace(" ", "-"));
        
        // Upsert media (mocking canonical match)
        let _ = sqlx::query(
            "INSERT INTO media (internal_id, title, media_type, release_year) 
             VALUES (?, ?, 'movie', ?)
             ON CONFLICT(internal_id) DO NOTHING"
        )
        .bind(&media_id)
        .bind(&row.name)
        .bind(row.year)
        .execute(&*pool)
        .await;

        // Insert watch event
        let event_id = Uuid::new_v4().to_string();
        let _ = sqlx::query(
            "INSERT INTO watch_events (id, media_id, watched_date) VALUES (?, ?, ?)"
        )
        .bind(&event_id)
        .bind(&media_id)
        .bind(row.watched_date.clone()) // This could be parsed to NaiveDate, keeping simple for string fallback
        .execute(&*pool)
        .await;

        // Insert user rating if present
        if let Some(rating) = row.rating {
            let rating_value = (rating * 2.0) as i32; // Convert 4.5 -> 9
            let rating_id = Uuid::new_v4().to_string();
            let _ = sqlx::query(
                "INSERT INTO user_ratings (id, media_id, rating_value, source) 
                 VALUES (?, ?, ?, 'letterboxd')
                 ON CONFLICT(profile_id, media_id) DO UPDATE SET rating_value = ?"
            )
            .bind(&rating_id)
            .bind(&media_id)
            .bind(rating_value)
            .bind(rating_value)
            .execute(&*pool)
            .await;
        }
    }
    
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

#[tauri::command]
pub async fn check_tmdb_token() -> Result<bool, String> {
    let token = crate::services::credentials::get_tmdb_token()
        .map_err(|e| e.to_string())?;
    Ok(token.is_some())
}

#[tauri::command]
pub async fn save_tmdb_token_command(token: String) -> Result<bool, String> {
    // Basic test query
    let client = reqwest::Client::new();
    let res = client.get("https://api.themoviedb.org/3/authentication")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    if !res.status().is_success() {
        return Err("Invalid or expired token.".to_string());
    }

    crate::services::credentials::save_tmdb_token(&token).map_err(|e| e.to_string())?;
    Ok(true)
}
