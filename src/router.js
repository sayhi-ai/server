require('es6-promise').polyfill();
import express from "express";
import bodyParser from "body-parser";
import ClientsHandler from "./clients/clientsHandler";
import FunctionHandler from "./functions/functionHandler";

// Set up express server
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Set up handlers
const clientsHandler = new ClientsHandler();
const functionHandler = new FunctionHandler(clientsHandler);

// Test
app.get('/test', (req, res) => {
  functionHandler.getActivationHandler().sendActivationRequest(
    "renebrandel@outlook.com", "citn3nxyq01el0116gan662mw", "Rene",
    response => res.send(response),
    error => res.send(error));
});

// Activate account
app.get('/activate', (req, res) => {
  functionHandler.getActivationHandler().activateAccount(req.query.code,
    response => res.redirect('https://google.com'),
    error => res.send("Error activating account"));
});

// Login
app.post('/login', (req, res) => {
  let data = req.body;
  functionHandler.getUserHandler().login(data.email, data.password,
    response => res.send(response),
    error => res.send("Error during login"));
});

// Create an account
app.post('/createaccount', (req, res) => {
  let data = req.body;
  functionHandler.getUserHandler().addUser(data.firstName, data.lastName,
    data.email, data.password,
    response => res.send(response),
    error => res.send("Error creating an account"));
});

// Change password
app.post('/changepassword', (req, res) => {

});

// Add email to mailing list
app.post('/subscribe', (req, res) => {
  let data = req.body;
  functionHandler.getMailingListHandler().addToMailingList(data.email,
    response => res.send(response),
    error => res.send("Error subscribing to mailing list"));
});

// Remove email from mailing list
app.post('/unsubscribe', (req, res) => {
  let data = req.body;
  functionHandler.getMailingListHandler().removeFromMailingList(data.email,
    response => res.send(response),
    error => res.send("Error unsubscribing from mailing list"));
});

// Get response
app.post('/getresponse', (req, res) => {
  let data = req.body;
  functionHandler.getResponseHandler().getResponse(data.token, data.phrase,
    data.persona,
    response => res.send(response),
    error => res.send("Error getting response"));
});

// Add response
app.post('/addresponse', (req, res) => {
  let data = req.body;
  functionHandler.getResponseHandler().addResponse(data.token, data.phrase,
    data.persona, data.response,
    response => res.send(response),
    error => res.send("Error adding a response"));
});

// Remove response
app.post('/removeresponse', (req, res) => {
  let data = req.body;
  functionHandler.getResponseHandler().removeResponse(data.token, data.response,
    response => res.send(response),
    error => res.send("Error removing a response"));
});

// Start express server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Express server listening at http://%s:%s', host, port);
});
