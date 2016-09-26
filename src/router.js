require('es6-promise').polyfill();
import express from "express";
import bodyParser from "body-parser";
import GCClient from "./graphcoolClient";
import ENV_VARS from "./ENV_VARS";

// Set up express server
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Set up graph cool client
const gcClient = new GCClient();

// Create an account
app.post('/create-account', (req, res) => {
  let data = req.body;
  let query = {
    data: "mutation {createUser(" +
      "firstName: \\\"" + data.firstName +
      "\\\", lastName: \\\"" + data.lastName +
      "\\\", email: \\\"" + data.email +
      "\\\", password: \\\"" + data.password + "\\\")" +
      "{id}}",
    token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
  };

  gcClient.query(query, response => {
    res.send(response);
  }, error => {
    res.send("Error during login");
  });
});

// Login
app.post('/login', (req, res) => {
  let data = req.body;
  let query = {
    data: "mutation {signinUser(email: \\\"" + data.email +
      "\\\", password: \\\"" + data.password + "\\\")" +
      "{user{firstName, email}, token}}"
  };

  gcClient.login(query, response => {
    res.send(response);
  }, error => {
    res.send("Error during login");
  });
});

// Change password
app.post('/change-password', (req, res) => {

});

// Add email to mailing list
app.post('/add-mailing-list', (req, res) => {
  let data = req.body;
  let query = {
    data: "mutation {createUser(" +
    "firstName: \\\"" + data.firstName +
    "\\\", lastName: \\\"" + data.lastName +
    "\\\", email: \\\"" + data.email +
    "\\\", password: \\\"" + data.password + "\\\")" +
    "{id}}"
  };

  gcClient.query(query, response => {
    res.send(response);
  }, error => {
    res.send("Error during login");
  });
});

// Remove email from mailing list
app.post('/remove-mailing-list', (req, res) => {

});

// Start express server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Express server listening at http://%s:%s', host, port);
});
