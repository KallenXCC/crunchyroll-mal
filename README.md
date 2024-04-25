# crunchyroll-mal
Use Crunchyroll and My Anime List APIs to add Crunchyroll watch history to MAL

## MAL API
https://myanimelist.net/clubs.php?cid=13727

## Creating/updating MAL authorization tokens
https://myanimelist.net/blog.php?eid=835707

## Crunchyroll API
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

search.js finds a specified anime on MAL by title or alternative titles  
 * INPUT: anime title  
 * OUTPUT: MAL anime entry, including anime ID  

updatelist.js adds an anime to the currently watching list  
 * INPUT: MAL anime ID, ACCESS_TOKEN  
 * OUTPUT: modified list entry  

main.js puts these components together  

history.rs compiles titles of all anime in watch history and writes to file
 * INPUT: crunchyroll email and password
 * OUTPUT: watch history (title, episodes watched, date played) sorted into three files
 * watchHistoryAlpha.txt sorts anime alphabetically
 * watchHistoryChrono.txt sorts anime by date played reverse chronologically
 * invalidTitles.txt includes entries of anime with empty titles (series titles were empty so parent_id -> series.title was used instead)
 * anime titles with (English Dub) are removed because I didn't watch most of those, remember to remove this for future use

## TODO
have js parse the txt output from rs