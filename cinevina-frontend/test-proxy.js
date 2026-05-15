const http = require('http');
http.get('http://localhost:5173/api/proxy/image?url=https%3A%2F%2Fphimimg.com%2Fupload%2Fvod%2F20260513-1%2F652c18734c19a60250449ddc87a860f2.jpg', (res) => {
  console.log(res.statusCode, res.headers['content-type'], res.headers['content-length']);
}).on('error', console.error);
