const token = 'ACCESS_TOKEN';
const baseUrl = 'https://api.myanimelist.net/v2/anime';

function search(query) { //search a title and return an id
    var url = baseUrl + '?q=' + query;
    var limit = 1;
    url = url + '&limit=' + limit;
    var fields = 'alternative_titles';
    url = url + '&fields=' + fields;
    var nsfw = true;
    url = url + '&nsfw=' + nsfw;

    return fetch(url, {
        method: 'GET',
        headers: {
        'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.json())
        .then(data => {
            var result = data.data[0].node;
            var id = result.id;
            console.log('ID: ' + id);
            console.log('Title: ' + result.title);
            console.log(result.alternative_titles);
            return id;
        })
        .catch(error => {
            console.error(error);
            return -1;
        });
}

function updateList(id) {
    var url = baseUrl + '/' + id + '/my_list_status';

    fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'status': 'watching',
            'tags': 'crunchyroll-mal'
        })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

let searchTitle = 'Kamikatsu';
search(searchTitle)
  .then(searchId => {
    console.log(searchId);
    updateList(searchId);
  })
  .catch(error => {
    console.error(error);
  });
