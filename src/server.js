import express from "express";

const app = express();

app.get('/', function(req, res) {
  res.send('this is awesome request to homepage');
});

app.get('/login', function(req, res) {
  res.send('login request');
});

// Express server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Essential React listening at http://%s:%s', host, port);
});
