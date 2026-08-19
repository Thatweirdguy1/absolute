use sqlx::{sqlite::{SqliteConnectOptions, SqliteJournalMode, SqliteSynchronous}, SqlitePool};
use std::path::PathBuf;
use std::str::FromStr;
use tauri::AppHandle;
use directories::ProjectDirs;

pub async fn init_db(app_handle: &AppHandle) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let proj_dirs = ProjectDirs::from("com", "absolute", "Absolute").expect("Could not determine project directories");
    let data_dir = proj_dirs.data_local_dir();
    
    if !data_dir.exists() {
        std::fs::create_dir_all(data_dir)?;
    }
    
    let db_path = data_dir.join("absolute_data.sqlite");
    
    let options = SqliteConnectOptions::from_str(&format!("sqlite:{}", db_path.display()))?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .foreign_keys(true)
        .busy_timeout(std::time::Duration::from_millis(5000));

    let pool = SqlitePool::connect_with(options).await?;
    
    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    Ok(pool)
}
