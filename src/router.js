require('es6-promise').polyfill();
import express from "express";
import bodyParser from "body-parser";
import GCClient from "./graphcoolClient";

// Set up express server
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Set up graph cool client
const gcClient = new GCClient();

// Routing
app.post('/', (req, res) => {
  let data = req.body;

  gcClient.fetch(data, response => {
    console.log(response.data.allUsers[0]);
  }, error => {
    console.log(error);
  });

  res.send('recieved data: ' + data);
});

app.get('/login', (req, res) => {
  res.send('login request');
});

// Start express server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Express server listening at http://%s:%s', host, port);
});
