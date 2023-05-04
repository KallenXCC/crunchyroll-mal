const token = 'ACCESS_TOKEN';
var url = 'https://api.myanimelist.net/v2/anime?';
var query = 'Kamikatsu';
url = url + 'q=' + query;
var limit = 1;
url = url + '&limit=' + limit;
var offset = '';
var fields = 'alternative_titles';
url = url + '&fields=' + fields;
var nsfw = true;
url = url + '&nsfw=' + nsfw;

fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(response => response.json())
  .then(data => {
    console.log(data);
    for(let i = 0; i < data.data.length; i++) {
        var result = data.data[i].node;
        console.log('ID: ' + result.id);
        console.log('Title: ' + result.title);
        console.log(result.alternative_titles);
    }
  })
  .catch(error => console.error(error));