require('es6-promise').polyfill();
import express from "express";
import bodyParser from "body-parser";
import fetch from "isomorphic-fetch"
import {createQuery} from "./queryCreator";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/', function(req, res) {
  let data = req.body;

  console.log(createQuery(data.request));

  fetch("https://api.graph.cool/simple/v1/citcyox3z0pbh0171u6i6b8nu", {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: createQuery(data.request)
  })
  .then(response => {
    if (response.status === 200) {
      response.json().then(json => console.log(json));
    } else {
      response.json().then(json => console.log(json));
    }
  });

  res.send('recieved data: ' + data);
});

app.get('/login', function(req, res) {
  res.send('login request');
});

// Express server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Express server listening at http://%s:%s', host, port);
});
