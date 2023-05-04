const token = 'ACCESS_TOKEN';
var url = 'https://api.myanimelist.net/v2/anime?';
var query = 'mashle';
url = url + 'q=' + query;
var limit = '1';
url = url + '&limit=' + limit;
var offset = '';
var fields = '';

fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(response => response.json())
  .then(data => {
    var result = data.data[0].node;
    var id = result.id;
    var title = result.title;
    console.log(id);
    console.log(title);
  })
  .catch(error => console.error(error));