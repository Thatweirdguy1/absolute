use crate::error::AppResult;
use std::fs::File;
use std::path::Path;
use zip::ZipArchive;
use serde::Deserialize;
use chrono::NaiveDate;

#[derive(Debug, Deserialize)]
pub struct DiaryRow {
    #[serde(rename = "Date")]
    pub date: Option<String>,
    #[serde(rename = "Name")]
    pub name: String,
    #[serde(rename = "Year")]
    pub year: Option<i32>,
    #[serde(rename = "Letterboxd URI")]
    pub letterboxd_uri: Option<String>,
    #[serde(rename = "Rating")]
    pub rating: Option<f32>,
    #[serde(rename = "Rewatch")]
    pub rewatch: Option<String>,
    #[serde(rename = "Tags")]
    pub tags: Option<String>,
    #[serde(rename = "Watched Date")]
    pub watched_date: Option<String>,
}

pub fn parse_diary_csv<P: AsRef<Path>>(path: P) -> AppResult<Vec<DiaryRow>> {
    let mut rdr = csv::Reader::from_path(path)?;
    let mut rows = Vec::new();
    for result in rdr.deserialize() {
        let record: DiaryRow = result?;
        rows.push(record);
    }
    Ok(rows)
}

pub fn extract_and_parse_zip<P: AsRef<Path>>(path: P, dest_dir: P) -> AppResult<()> {
    let file = File::open(path)?;
    let mut archive = ZipArchive::new(file)?;
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let outpath = match file.enclosed_name() {
            Some(path) => path.to_owned(),
            None => continue,
        };
        
        let outpath = dest_dir.as_ref().join(outpath);
        
        if (*file.name()).ends_with('/') {
            std::fs::create_dir_all(&outpath)?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    std::fs::create_dir_all(p)?;
                }
            }
            let mut outfile = File::create(&outpath)?;
            std::io::copy(&mut file, &mut outfile)?;
        }
    }
    Ok(())
}
