const fs = require('fs');

const token = 'ACCESS_TOKEN';
var url = 'https://api.myanimelist.net/v2/anime?';
var limit = 1;
var fields = 'alternative_titles';
var nsfw = true;

const watchHistoryPath = './crunchyroll-rs/watch-history/watchHistory.json';
const watchHistory_json = fs.readFileSync(watchHistoryPath, 'utf8');
const animeTitles = [];
try {
  const watchHistory = JSON.parse(watchHistory_json);
  for (const title in watchHistory) {
      if (watchHistory.hasOwnProperty(title)) {
          animeTitles.push(title);
      }
  }
} catch (error) {
  console.error('Error parsing watchHistory.json:', error);
}

var searchResults = [];

function searchAnime(query) {
    var searchUrl = url + 'q=' + query + '&limit=' + limit + '&fields=' + fields + '&nsfw=' + nsfw;

    return fetch(searchUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.data.length > 0) {
            var result = data.data[0].node;
            result.query = query;
            searchResults.push(result);
            console.log('Query completed:', query);
        } else {
            console.log('Anime not found: ' + query);
        }
    })
    .catch(error => console.error(error));
}

Promise.all(animeTitles.map(searchAnime))
    .then(() => {
        fs.writeFileSync('searchResults.json', JSON.stringify(searchResults, null, 2));
        console.log('Search results written to searchResults.json');
    });
