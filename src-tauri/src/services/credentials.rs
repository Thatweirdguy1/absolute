use keyring::Entry;
use crate::error::AppResult;

const SERVICE_NAME: &str = "absolute_app_tmdb";
const ACCOUNT_NAME: &str = "default_user";

pub fn save_tmdb_token(token: &str) -> AppResult<()> {
    let entry = Entry::new(SERVICE_NAME, ACCOUNT_NAME)
        .map_err(|e| crate::error::AppError::Internal(format!("Keyring error: {}", e)))?;
    
    entry.set_password(token)
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to save token: {}", e)))?;
    
    Ok(())
}

pub fn get_tmdb_token() -> AppResult<Option<String>> {
    let entry = Entry::new(SERVICE_NAME, ACCOUNT_NAME)
        .map_err(|e| crate::error::AppError::Internal(format!("Keyring error: {}", e)))?;
    
    match entry.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(crate::error::AppError::Internal(format!("Failed to retrieve token: {}", e))),
    }
}
