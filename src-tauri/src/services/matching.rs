use crate::error::AppResult;
use crate::services::tmdb::{TmdbClient, TmdbSearchResultItem};
use strsim::jaro_winkler;

pub struct MatchCandidate {
    pub item: TmdbSearchResultItem,
    pub score: f64,
}

pub struct Resolver {
    tmdb: TmdbClient,
}

impl Resolver {
    pub fn new(tmdb_key: String) -> Self {
        Self {
            tmdb: TmdbClient::new(tmdb_key),
        }
    }

    pub async fn resolve_title(&self, query_title: &str, query_year: Option<i32>) -> AppResult<Option<MatchCandidate>> {
        // Step 1. Query TMDB multi-search
        let search_res = self.tmdb.search_multi(query_title, query_year).await?;
        
        // Step 2. Remove person results
        let mut candidates = Vec::new();
        
        for item in search_res.results {
            if let Some(ref media_type) = item.media_type {
                if media_type == "person" {
                    continue;
                }
            }
            
            // Step 3. Score candidate
            let score = self.score_candidate(&item, query_title, query_year);
            candidates.push(MatchCandidate { item, score });
        }
        
        // Sort by score descending
        candidates.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        
        if let Some(best) = candidates.into_iter().next() {
            // Step 4. Auto-accept only high-confidence (arbitrary threshold for now)
            if best.score > 0.85 {
                return Ok(Some(best));
            }
            // Lower confidence would be quarantined in the DB for manual review.
            // For MVP, we'll still return it but we would mark it as 'quarantined' in the DB.
            return Ok(Some(best));
        }
        
        Ok(None)
    }
    
    fn score_candidate(&self, item: &TmdbSearchResultItem, query_title: &str, query_year: Option<i32>) -> f64 {
        let mut score = 0.0;
        
        let title = item.title.as_deref().or(item.name.as_deref()).unwrap_or("");
        
        // String similarity (Jaro-Winkler)
        let sim = jaro_winkler(&title.to_lowercase(), &query_title.to_lowercase());
        score += sim * 0.6; // 60% weight to title match
        
        // Year match
        if let Some(q_year) = query_year {
            let item_date = item.release_date.as_deref().or(item.first_air_date.as_deref());
            if let Some(date_str) = item_date {
                if date_str.len() >= 4 {
                    if let Ok(item_year) = date_str[0..4].parse::<i32>() {
                        let diff = (item_year - q_year).abs();
                        if diff == 0 {
                            score += 0.4; // Exact year match
                        } else if diff == 1 {
                            score += 0.2; // +/- 1 year tolerance
                        }
                    }
                }
            }
        } else {
            score += 0.2; // Give some baseline if we don't have a year to check
        }
        
        score
    }
}
