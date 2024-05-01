const fs = require('fs');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://KallenXCC:<password>@crunchyroll-mal.2osby6y.mongodb.net/';
const dbName = 'crunchyroll-mal';
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
        animeTitles.push({
            title: title,
            episodes_watched: watchHistory[title].episodes_watched,
            date_played: watchHistory[title].date_played
          });
      }
  }
} catch (error) {
  console.error('Error parsing watchHistory.json:', error);
}

var searchResults = [];
var numSearches = 0;
var numMatches = 0;

processSearches()
    .then(() => {
        fs.writeFileSync('searchResults.json', JSON.stringify(searchResults, null, 2));
        console.log('Search results written to searchResults.json');
        console.log(numMatches, '/', numSearches, ' searches matched');
        insertDataToMongoDB(searchResults);
    })
    .catch(error => console.error(error));


async function processSearches() {
    for (const query of animeTitles) {
        await searchAnime(query);
    }
}

async function searchAnime(query) {
    var searchTitle = query.title;
    if(searchTitle.length > 60) {
        searchTitle = searchTitle.substr(0, 60);
    }
    var searchUrl = url + 'q=' + searchTitle + '&limit=' + limit + '&fields=' + fields + '&nsfw=' + nsfw;
    numSearches++;

    const data = await fetchWithRetries(searchUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (data.data && data.data.length > 0) {
        var result = data.data[0].node;
        result.query = query.title;
        result.episodes_watched = query.episodes_watched;
        result.date_played = query.date_played;
        searchResults.push(result);
        numMatches++;
        if(numMatches % 20 == 0) {
            console.log(numMatches, ' queries completed');
        }
    } else {
        console.log('Search failed: ', query, 'Details: ', data);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetries(url, options, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                await handleHttpError(response);
                continue; // Retry after handling error
            }
            return await response.json();
        } catch (error) {
            if (attempt < retries) {
                const delayTime = Math.pow(2, attempt) * 1000;
                console.log(`Request failed. ${error} Retrying in ${delayTime / 1000} seconds (attempt ${attempt}/${retries})...`);
                await delay(delayTime);
            } else {
                throw error;
            }
        }
    }
}

async function handleHttpError(response) {
    if (response.status === 504) {
        console.log('Gateway Timeout (504) encountered. Retrying in 3 minutes...');
        await delay(3 * 60 * 1000); // Delay for 3 minutes (3 * 60 seconds * 1000 milliseconds)
    } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
}

async function insertDataToMongoDB(data) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(dbName);
        const collection = db.collection('searchResults');

        const result = await collection.insertMany(data);
        console.log(`${result.insertedCount} documents inserted into MongoDB`);
    } catch (error) {
        console.error('Error inserting data into MongoDB:', error);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}