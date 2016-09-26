require('es6-promise').polyfill();
import express from "express";
import bodyParser from "body-parser";
import GCClient from "./graphcoolClient";
import UserHandler from "./account/userHandler";

// Set up express server
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Set up handlers
const gcClient = new GCClient();
const userHandler = new UserHandler(gcClient);

// Login
app.post('/login', (req, res) => {
  let data = req.body;
  userHandler.login(data.email, data.password,
    response => res.send(response),
    error => res.send("Error during login"));
});

// Create an account
app.post('/create-account', (req, res) => {
  let data = req.body;
  userHandler.addUser(data.firstName, data.lastName, data.email,
    data.password,
    response => res.send(response),
    error => res.send("Error during login"));
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
