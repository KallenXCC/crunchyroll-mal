const token = 'ACCESS_TOKEN';
var url = 'https://api.myanimelist.net/v2/anime/';
var id = 52211;
url = url + id + '/my_list_status';

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
