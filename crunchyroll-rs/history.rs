use crunchyroll_rs::{Crunchyroll, MediaCollection};
use crunchyroll_rs::common::StreamExt;
use anyhow::Result;
use crunchyroll_rs::list::WatchHistoryEntry;
use std::fs::File;
use std::io::prelude::*;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let email = env::var("EMAIL").expect("'EMAIL' environment variable not found");
    let password = env::var("PASSWORD").expect("'PASSWORD' environment variable not found");

    let crunchyroll = Crunchyroll::builder()
        .login_with_credentials(email, password)
        .await?;

    let mut file = File::create("watchHistory.txt")?;

    let mut total = 0;
    let mut history = crunchyroll.watch_history();
    while let Some(item) = history.next().await {
        match item? {
            WatchHistoryEntry {id: entry, parent_id, parent_type, date_played, playhead, fully_watched, panel} => {
                total += 1;
                let anime_title: String;
                let format: String;
                match panel {
                    MediaCollection::Series(series) => {
                        format = String::from("Series");
                        anime_title = series.title;
                    }
                    MediaCollection::Season(season) => {
                        format = String::from("Season");
                        anime_title = season.title;
                    }
                    MediaCollection::Episode(episode) => {
                        format = String::from("Episode");
                        anime_title = episode.series_title;
                    }
                    MediaCollection::MovieListing(movie_list) => {
                        format = String::from("Movie Listing");
                        anime_title = movie_list.title;
                    }
                    MediaCollection::Movie(movie) => {
                        format = String::from("Movie");
                        anime_title = movie.title;
                    }
                    MediaCollection::MusicVideo(amv) => {
                        format = String::from("Anime Music Video");
                        anime_title = amv.title;
                    }
                    MediaCollection::Concert(conc) => {
                        format = String::from("Concert");
                        anime_title = conc.title;
                    }
                }
                let line = format!("Entry {}:Type: {} \tTitle of entry: {}\n",total, format, anime_title);
                file.write_all(&*line.into_bytes())?;
            }
        }
    }

    Ok(())
}