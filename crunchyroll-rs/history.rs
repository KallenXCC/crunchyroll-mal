use crunchyroll_rs::{Crunchyroll, MediaCollection};
use crunchyroll_rs::common::StreamExt;
use anyhow::Result;
use crunchyroll_rs::list::WatchHistoryEntry;
use std::fs::File;
use std::io::prelude::*;
use std::env;
use std::collections::HashMap;
use std::io::BufWriter;
use crunchyroll_rs::Series;
use chrono::{DateTime, Utc};
use serde_json;
use serde::{Serialize, Serializer};

#[derive(Debug, Serialize)]
struct TitleInfo {
    episodes_watched: usize,
    date_played: DateTime<Utc>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let email = env::var("EMAIL").expect("'EMAIL' environment variable not found");
    let password = env::var("PASSWORD").expect("'PASSWORD' environment variable not found");

    let crunchyroll = Crunchyroll::builder()
        .login_with_credentials(email, password)
        .await?;

    let mut history = crunchyroll.watch_history();
    let mut anime_watched: HashMap<String, TitleInfo> = HashMap::new();
    let mut invalid_titles: Vec<String> = Vec::new();

    while let Some(item) = history.next().await {
        match item? {
            WatchHistoryEntry {id: entry, parent_id, parent_type, date_played, playhead: _, fully_watched, panel} => {
                if fully_watched {
                    let anime_title: String;
                    match panel {
                        MediaCollection::Season(season) => {
                            anime_title = season.title;
                        }
                        MediaCollection::Episode(episode) => {
                            anime_title = episode.season_title;
                        }
                        MediaCollection::MovieListing(movie_list) => {
                            anime_title = movie_list.title;
                        }
                        MediaCollection::Movie(movie) => {
                            anime_title = movie.title;
                        }
                        MediaCollection::MusicVideo(amv) => {
                            anime_title = amv.title;
                        }
                        MediaCollection::Concert(conc) => {
                            anime_title = conc.title;
                        }
                        MediaCollection::Series(_series) => {
                            let series: Series = crunchyroll.media_from_id(parent_id).await?;
                            anime_title = series.title;
                        }
                    }
                    if anime_title.trim().is_empty() || !anime_title.chars().any(char::is_alphanumeric) {
                        invalid_titles.push(entry);
                        invalid_titles.push(parent_type);
                        invalid_titles.push(date_played.to_string());
                        invalid_titles.push("==========".to_string());
                        continue;
                    }

                    if !anime_title.contains("(English Dub)") {
                        let title_info = anime_watched.entry(anime_title.clone()).or_insert(TitleInfo {
                            episodes_watched: 0,
                            date_played,
                        });
                        title_info.episodes_watched += 1;
                    }
                }
            }
        }
    }

    let mut sorted_alpha: Vec<_> = anime_watched.iter().collect();
    sorted_alpha.sort_by(|a, b| a.0.cmp(b.0));
    let mut file_alpha = BufWriter::new(File::create("watchHistoryAlpha.txt")?);
    for (title, title_info) in sorted_alpha {
        let line = format!(
            "{}\tEpisodes Watched: {}\tDate Played: {}\n",
            title,
            title_info.episodes_watched,
            title_info.date_played.format("%m-%d-%Y")
        );
        file_alpha.write_all(line.as_bytes())?;
    }

    let mut sorted_chrono: Vec<_> = anime_watched.iter().collect();
    sorted_chrono.sort_by(|a, b| b.1.date_played.cmp(&a.1.date_played));
    let mut file_chrono = BufWriter::new(File::create("watchHistoryChrono.txt")?);
    for (title, title_info) in sorted_chrono {
        let line = format!(
            "{}\tEpisodes Watched: {}\tDate Played: {}\n",
            title,
            title_info.episodes_watched,
            title_info.date_played.format("%m-%d-%Y")
        );
        file_chrono.write_all(line.as_bytes())?;
    }

    let json_data = serde_json::to_string_pretty(&anime_watched)?;
    let mut file = BufWriter::new(File::create("watchHistory.json")?);
    file.write_all(json_data.as_bytes())?;

    if !invalid_titles.is_empty() {
        let mut file_invalid = BufWriter::new(File::create("invalidTitles.txt")?);
        for entry in &invalid_titles {
            writeln!(file_invalid, "{:?}", entry)?;
        }
    }

    Ok(())
}