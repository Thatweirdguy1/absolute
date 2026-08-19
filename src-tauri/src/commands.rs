use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::LocalProfile;
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
pub async fn update_profile(
    display_name: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<bool, String> {
    sqlx::query("UPDATE local_profiles SET display_name = ?")
        .bind(&display_name)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub async fn import_letterboxd_csv(
    file_path: String,
    pool: tauri::State<'_, SqlitePool>
) -> Result<usize, String> {
    let path = std::path::Path::new(&file_path);
    let mut total_records = 0;
    
    let is_zip = path.extension().and_then(|e| e.to_str()) == Some("zip");
    
    let temp_dir = std::env::temp_dir().join(Uuid::new_v4().to_string());
    if is_zip {
        std::fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
        crate::services::letterboxd::extract_and_parse_zip(&file_path, &temp_dir)
            .map_err(|e| format!("Failed to extract ZIP: {}", e))?;
    }

    let batch_id = Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO import_batches (id, source, status, total_count) VALUES (?, ?, ?, ?)")
        .bind(&batch_id).bind("letterboxd_full").bind("processing").bind(0)
        .execute(&*pool).await.map_err(|e| e.to_string())?;

    // Helper macro to insert media
    macro_rules! upsert_media {
        ($id:expr, $name:expr, $year:expr) => {
            let _ = sqlx::query(
                "INSERT INTO media (internal_id, title, media_type, release_year) VALUES (?, ?, 'movie', ?) ON CONFLICT(internal_id) DO NOTHING"
            ).bind(&$id).bind($name).bind($year).execute(&*pool).await;
        };
    }

    // Process Diary
    let diary_path = if is_zip { temp_dir.join("diary.csv") } else { path.to_path_buf() };
    if diary_path.exists() {
        let mut rdr = csv::ReaderBuilder::new().flexible(true).from_path(&diary_path).unwrap();
        for result in rdr.deserialize::<crate::services::letterboxd::DiaryRow>() {
            if let Ok(row) = result {
                total_records += 1;
                let media_id = format!("lbx:{}", row.name.to_lowercase().replace(" ", "-"));
                upsert_media!(media_id, &row.name, row.year);

                let event_id = Uuid::new_v4().to_string();
                let _ = sqlx::query("INSERT INTO watch_events (id, media_id, watched_date) VALUES (?, ?, ?)")
                    .bind(&event_id).bind(&media_id).bind(row.watched_date.clone()).execute(&*pool).await;

                if let Some(rating) = row.rating {
                    let rating_value = (rating * 2.0) as i32;
                    let rating_id = Uuid::new_v4().to_string();
                    let _ = sqlx::query("INSERT INTO user_ratings (id, media_id, rating_value, source) VALUES (?, ?, ?, 'letterboxd') ON CONFLICT(profile_id, media_id) DO UPDATE SET rating_value = ?")
                        .bind(&rating_id).bind(&media_id).bind(rating_value).bind(rating_value).execute(&*pool).await;
                }
            }
        }
    }

    // Process Watched
    if is_zip {
        let watched_path = temp_dir.join("watched.csv");
        if watched_path.exists() {
            let mut rdr = csv::ReaderBuilder::new().flexible(true).from_path(&watched_path).unwrap();
            for result in rdr.deserialize::<crate::services::letterboxd::WatchedRow>() {
                if let Ok(row) = result {
                    total_records += 1;
                    let media_id = format!("lbx:{}", row.name.to_lowercase().replace(" ", "-"));
                    upsert_media!(media_id, &row.name, row.year);
                    
                    let event_id = Uuid::new_v4().to_string();
                    let _ = sqlx::query("INSERT INTO watch_events (id, media_id, watched_date) VALUES (?, ?, ?)")
                        .bind(&event_id).bind(&media_id).bind(row.date.clone()).execute(&*pool).await;
                }
            }
        }
        
        let ratings_path = temp_dir.join("ratings.csv");
        if ratings_path.exists() {
            let mut rdr = csv::ReaderBuilder::new().flexible(true).from_path(&ratings_path).unwrap();
            for result in rdr.deserialize::<crate::services::letterboxd::RatingRow>() {
                if let Ok(row) = result {
                    total_records += 1;
                    let media_id = format!("lbx:{}", row.name.to_lowercase().replace(" ", "-"));
                    upsert_media!(media_id, &row.name, row.year);
                    
                    if let Some(rating) = row.rating {
                        let rating_value = (rating * 2.0) as i32;
                        let rating_id = Uuid::new_v4().to_string();
                        let _ = sqlx::query("INSERT INTO user_ratings (id, media_id, rating_value, source) VALUES (?, ?, ?, 'letterboxd') ON CONFLICT(profile_id, media_id) DO UPDATE SET rating_value = ?")
                            .bind(&rating_id).bind(&media_id).bind(rating_value).bind(rating_value).execute(&*pool).await;
                    }
                }
            }
        }
    }
    
    // Update batch to completed
    sqlx::query("UPDATE import_batches SET status = 'completed', total_count = ? WHERE id = ?")
        .bind(total_records as i32).bind(&batch_id).execute(&*pool).await.map_err(|e| e.to_string())?;

    Ok(total_records)
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

#[derive(Serialize)]
pub struct HistoryEvent {
    id: String,
    title: String,
    media_type: String,
    release_year: Option<i32>,
    watched_date: Option<String>,
    rating_value: Option<i32>,
    poster_path: Option<String>,
}

#[tauri::command]
pub async fn get_history(
    pool: tauri::State<'_, SqlitePool>
) -> Result<Vec<HistoryEvent>, String> {
    let rows = sqlx::query(
        "SELECT we.id, m.title, m.media_type, m.release_year, we.watched_date, r.rating_value, m.poster_path
        FROM watch_events we
        JOIN media m ON we.media_id = m.internal_id
        LEFT JOIN user_ratings r ON r.media_id = m.internal_id
        ORDER BY we.watched_date DESC NULLS LAST
        LIMIT 100"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    
    let mut history = Vec::new();
    for row in rows {
        use sqlx::Row;
        history.push(HistoryEvent {
            id: row.try_get("id").unwrap_or_default(),
            title: row.try_get("title").unwrap_or_default(),
            media_type: row.try_get("media_type").unwrap_or_default(),
            release_year: row.try_get("release_year").unwrap_or(None),
            watched_date: row.try_get("watched_date").unwrap_or(None),
            rating_value: row.try_get("rating_value").unwrap_or(None),
            poster_path: row.try_get("poster_path").unwrap_or(None),
        });
    }
    Ok(history)
}

#[tauri::command]
pub async fn resolve_missing_metadata(
    pool: tauri::State<'_, SqlitePool>
) -> Result<i32, String> {
    let token = crate::services::credentials::get_tmdb_token().map_err(|e| e.to_string())?;
    let token = match token {
        Some(t) => t,
        None => return Err("No TMDB token found".into()),
    };

    let tmdb = crate::services::tmdb::TmdbClient::new(token);

    // Get up to 50 missing items
    let missing_media = sqlx::query!(
        "SELECT internal_id, title, release_year FROM media WHERE tmdb_id IS NULL LIMIT 50"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let mut resolved_count = 0;

    for media in missing_media {
        let result = tmdb.search_multi(&media.title, media.release_year.map(|y| y as i32)).await;
        if let Ok(res) = result {
            if let Some(first) = res.results.first() {
                // Update DB
                let _ = sqlx::query!(
                    "UPDATE media SET tmdb_id = ?, poster_path = ?, backdrop_path = ?, overview = ?, metadata_completeness = 1 WHERE internal_id = ?",
                    first.id,
                    first.poster_path,
                    first.backdrop_path,
                    first.overview,
                    media.internal_id
                )
                .execute(&*pool)
                .await;
                resolved_count += 1;
            } else {
                // Mark as not found to avoid re-querying every time
                let _ = sqlx::query!(
                    "UPDATE media SET metadata_completeness = -1 WHERE internal_id = ?",
                    media.internal_id
                ).execute(&*pool).await;
            }
        }
    }

    Ok(resolved_count)
}
