# crunchyroll-mal
Use Crunchyroll and My Anime List APIs to add Crunchyroll watch history to MAL

## MAL API
https://myanimelist.net/clubs.php?cid=13727

## Creating/updating MAL authorization tokens
https://myanimelist.net/blog.php?eid=835707

## Crunchyroll API by CrunchyLabs
https://github.com/crunchy-labs/crunchyroll-rs?tab=readme-ov-file

Watch History Example:
https://github.com/crunchy-labs/crunchyroll-rs/issues/21
Function reference:
https://docs.rs/crunchyroll-rs/latest/crunchyroll_rs/crunchyroll/struct.Crunchyroll.html#method.watch_history
Watch History Entry:
https://docs.rs/crunchyroll-rs/latest/crunchyroll_rs/list/struct.WatchHistoryEntry.html

## Progress
user.js gets the MAL user connected to the access token  
 * INPUT: ACCESS_TOKEN  
 * OUTPUT: MAL user info, including user ID  

search.js searches for anime by titles  
 * INPUT: watchHistory.json (anime titles)
 * OUTPUT: searchResults.json (MAL anime entry, including anime ID)  

updatelist.js adds an anime to the currently watching list  
 * INPUT: MAL anime ID, ACCESS_TOKEN  
 * OUTPUT: modified list entry   

history.rs compiles titles of all anime in watch history and writes to file
 * INPUT: crunchyroll email and password
 * OUTPUT: watch history (title, episodes watched, date played) sorted into four files
 * watchHistory.json for passing the information to JS
 * watchHistoryAlpha.txt sorts anime alphabetically
 * watchHistoryChrono.txt sorts anime by date played reverse chronologically
 * invalidTitles.txt includes entries of anime with empty titles (series titles were empty so parent_id -> series.title was used instead)
 * anime titles with (English Dub) are removed because I didn't watch most of those, remember to remove this for future use

When need to run history.rs:
 * Go to folder with src and cargo.toml
 * Set environment variables in terminal: `$env:EMAIL = ""` `$env:PASSWORD = ""`
 * In terminal do `cargo build` then `cargo run`

MongoDB
mongodb+srv://KallenXCC:<password>@crunchyroll-mal.2osby6y.mongodb.net/

Design Summary:
1. crunchyroll-rs obtains watchHistory from crunchyroll, stores into a JSON file.
2. if the title does not exist in the MongoDB searchResults, search for it in MAL, then add it to MongoDB searchResults
 * update already existing searchResults by episodes_watched and date_played
3. if the id does not exist in MongoDB watchHistory, then upload it to MAL and add it to watchHistory
 * if id exists update episodes_watched and date_played

## TODO
(handle insertion behavior)
    don't insert entries that already exist, update them instead
    continue checking inserting even if some entries already exist
    handle errors more gracefully
(try to sort the database reverse chronologically)
--don't search for anime that already are in searchResults--
    --if title from JSON DNE as query on SearchResults, then search MAL--
--check new crunchyroll users feature--
    --history seems to work for default account so far--
(think in terms of how to get it uploaded to MAL efficiently)
(Only get recent watch history from crunchyroll)
!upload to MAL and MongoDB watchHistory
fix 401 unauthorized - refreshToken