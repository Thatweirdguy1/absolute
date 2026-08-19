use serde::{Serialize, Serializer};

#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),
    #[error("Tauri error: {0}")]
    Tauri(#[from] tauri::Error),
    #[error("CSV parsing error: {0}")]
    Csv(#[from] csv::Error),
    #[error("ZIP extraction error: {0}")]
    Zip(#[from] zip::result::ZipError),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Internal error: {0}")]
    Internal(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type AppResult<T> = Result<T, AppError>;
