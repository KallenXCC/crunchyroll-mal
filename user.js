const token = 'ACCESS_TOKEN_HERE';
const url = 'https://api.myanimelist.net/v2/users/@me?fields=anime_statistics';

fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));