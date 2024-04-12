# crunchyroll-mal
Use Crunchyroll and My Anime List apis to add Crunchyroll watch history to MAL

## MAL API
https://myanimelist.net/clubs.php?cid=13727

## Creating/updating MAL authorization tokens
https://myanimelist.net/blog.php?eid=835707

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

## TODO
Get a list of titles from crunchyroll watch history
