use crate::error::AppResult;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const TMDB_BASE_URL: &str = "https://api.themoviedb.org/3";

#[derive(Debug, Deserialize, Serialize)]
pub struct TmdbMultiSearchResult {
    pub page: i32,
    pub results: Vec<TmdbSearchResultItem>,
    pub total_pages: i32,
    pub total_results: i32,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct TmdbSearchResultItem {
    pub id: i64,
    pub media_type: Option<String>,
    pub title: Option<String>,
    pub name: Option<String>,
    pub original_title: Option<String>,
    pub original_name: Option<String>,
    pub release_date: Option<String>,
    pub first_air_date: Option<String>,
    pub overview: Option<String>,
    pub poster_path: Option<String>,
    pub popularity: Option<f64>,
}

pub struct TmdbClient {
    client: Client,
    api_key: String,
}

impl TmdbClient {
    pub fn new(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
        }
    }

    pub async fn search_multi(&self, query: &str, year: Option<i32>) -> AppResult<TmdbMultiSearchResult> {
        let mut url = format!("{}/search/multi?api_key={}&query={}", TMDB_BASE_URL, self.api_key, query);
        
        if let Some(y) = year {
            // Note: TMDB multi search doesn't strictly support primary_release_year, 
            // but we can pass year for some loose filtering, or filter manually.
            url.push_str(&format!("&year={}", y));
        }

        let resp = self.client.get(&url).send().await?.error_for_status()?;
        let result = resp.json::<TmdbMultiSearchResult>().await?;
        
        Ok(result)
    }
}
