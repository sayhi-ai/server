require('es6-promise').polyfill();
import express from "express";
import bodyParser from "body-parser";
import ServiceHandler from "./services/serviceHandler";
import FunctionHandler from "./functions/functionHandler";

// Set up express server
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Set up handlers
const serviceHandler = new ServiceHandler();
const functionHandler = new FunctionHandler(serviceHandler);

// Test
app.get('/test', (req, res) => {
  functionHandler.getActivationHandler().sendActivationRequest(
    "julianbrendl@gmail.com", "citmz4vi7044a0150v1q8mnbq", "Darth",
    response => res.send(response),
    error => res.send(error));
});

// Activate account
app.get('/activate', (req, res) => {
  functionHandler.getActivationHandler().activateAccount(req.query.code,
    response => res.send(response),
    error => res.send(error));
});

// Login
app.post('/login', (req, res) => {
  let data = req.body;
  functionHandler.getUserHandler.login(data.email, data.password,
    response => res.send(response),
    error => res.send("Error during login"));
});

// Create an account
app.post('/create-account', (req, res) => {
  let data = req.body;
  functionHandler.getUserHandler.addUser(data.firstName, data.lastName,
    data.email, data.password,
    response => res.send(response),
    error => res.send("Error creating an account: " + error));
});

// Change password
app.post('/change-password', (req, res) => {

});

// Add email to mailing list
app.post('/subscribe', (req, res) => {
  let data = req.body;
  functionHandler.getMailingListHandler().addToMailingList(data.email,
    response => res.send(response),
    error => res.send("Error adding to mailing list: " + error));
});

// Remove email from mailing list
app.post('/unsubscribe', (req, res) => {
  let data = req.body;
  functionHandler.getMailingListHandler().removeFromMailingList(data.email,
    response => res.send(response),
    error => res.send("Error adding to mailing list: " + error));
});

// Start express server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Express server listening at http://%s:%s', host, port);
});
