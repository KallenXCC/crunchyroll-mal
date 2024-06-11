const fs = require('fs');
const { MongoClient } = require('mongodb');

const token = 'ACCESS_TOKEN';
const uri = 'mongodb+srv://KallenXCC:<password>@crunchyroll-mal.2osby6y.mongodb.net/';
const dbName = 'crunchyroll-mal';
const colWatchHistory = 'watchHistory';
const colSearchResults = 'searchResults';
const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

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
        insertDataToMongoDB(searchResults, colSearchResults);
    })
    .catch(error => console.error(error));

async function processSearches() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Connected to MongoDB for processing searches');
        
        const db = client.db(dbName);

        for (const query of animeTitles) {
            const existingEntry = await searchResultExists(db, query.title);
            if (!existingEntry) {
                await searchAnime(query);
            } else {
                console.log(`Entry with title '${query.title}' already exists in searchResults collection. Skipping search.`);
                searchResults.push(query);
            }
        }
    } catch (error) {
        console.error('Error processing searches', error);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB, processed searches');
    }
}

async function searchResultExists(db, title) {
    const collection = db.collection(colSearchResults);
    const existingDocument = await collection.findOne({ title });
    return !!existingDocument;
}

async function searchAnime(query) {
    var searchTitle = query.title;
    if(searchTitle.length > 60) {
        searchTitle = searchTitle.substr(0, 60);
    }
    var url = 'https://api.myanimelist.net/v2/anime?';
    var limit = 1;
    var fields = 'alternative_titles';
    var nsfw = true;
    var searchUrl = url + 'q=' + searchTitle + '&limit=' + limit + '&fields=' + fields + '&nsfw=' + nsfw;
    numSearches++;

    console.log('querying MyAnimeList...');
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

async function insertDataToMongoDB(data, collectionName) {
    const client = new MongoClient(uri);
    let collection;
    try {
        await client.connect();
        console.log(`Connected to MongoDB for inserting into ${collectionName}`);

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const options = { ordered: false, upsert: true };
        const result = await collection.insertMany(data, options);
        console.log(`${result.insertedCount} documents inserted or updated in MongoDB`);
    } catch (error) {
        if(!collection) {
            console.error("Collection is empty");
        } else if (error.code === MONGO_DUPLICATE_KEY_ERROR_CODE) {
            for (const errorDetail of error.writeErrors) {
                const title = errorDetail.err.op.title;
                const { date_played, episodes_watched } = errorDetail.err.op;
                await collection.updateOne({ title: title }, { $set: { date_played, episodes_watched } });
                console.log(`Document with title "${title}" updated.`);
            }
        } else {
            console.error('Unexpected error inserting data into MongoDB:', error);
        }
    } finally {
        await client.close();
        console.log(`Disconnected from MongoDB, ${collectionName}`);
    }
}
