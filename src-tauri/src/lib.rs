pub mod db;
pub mod error;
pub mod models;
pub mod services;
pub mod commands;

use tauri::Manager;
use tokio::runtime::Runtime;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let rt = Runtime::new().expect("Failed to initialize Tokio runtime");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            let handle = app.handle().clone();
            
            // Initialize database asynchronously
            let pool = rt.block_on(async move {
                db::init_db(&handle).await.expect("Database initialization failed")
            });
            
            app.manage(pool);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_profile,
            commands::create_profile,
            commands::import_letterboxd_csv
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
