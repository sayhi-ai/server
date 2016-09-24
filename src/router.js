require('es6-promise').polyfill();
import express from "express";
import bodyParser from "body-parser";
import gcClient from "./graphcoolClient";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/', (req, res) => {
  let data = req.body;

  gcClient(data, response => {
    console.log(response);
  }, response => {
    console.log(response);
  });

  res.send('recieved data: ' + data);
});

app.get('/login', (req, res) => {
  res.send('login request');
});

// Express server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Express server listening at http://%s:%s', host, port);
});
