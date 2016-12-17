require('es6-promise').polyfill();
import express from "express";
import bodyParser from "body-parser";
import ClientsHandler from "./clients/clientsHandler";
import FunctionHandler from "./functions/functionHandler";
import ENV_VARS from "./ENV_VARS";

// Set up express server
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', ENV_VARS.CLIENT_URL);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS,' +
    'PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With,' +
    ' Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Set up handlers
const clientsHandler = new ClientsHandler();
const functionHandler = new FunctionHandler(clientsHandler);
const errorHandler = (error, detail, res) => {
  // TODO: Add some logging :)
  return res.status(500).send(JSON.stringify({
    error: error,
    detail: detail
  }));
};

// Test
app.get('/test', (req, res) => {
  functionHandler.getActivationHandler().sendActivationRequest(
    "renebrandel@outlook.com", "citn3nxyq01el0116gan662mw", "Rene",
    response => res.send(response),
    error => errorHandler(error, error, res));
});

// Activate account
app.get('/activate', (req, res) => {
  functionHandler.getActivationHandler().activateAccount(req.query.code,
    response => res.redirect('https://google.com'),
    error => errorHandler("Error activating account", error, res));
});

// Login
app.post('/login', (req, res) => {
  let data = req.body;
  functionHandler.getUserHandler().login(data.email, data.password,
    response => {
      return res.send(response);
    },
    error => errorHandler("Error during login", error, res));
});

// Create an account
app.post('/linkaccountauth0', (req, res) => {
  let data = req.body;
  functionHandler.getUserHandler().linkAccountAuth0(data.firstName,
    data.lastName, data.token,
    response => res.send(response),
    error => errorHandler("Error creating an account", error, res));
});

// Create an account
app.post('/createaccount', (req, res) => {
  let data = req.body;
  functionHandler.getUserHandler().addUser(data.firstName, data.lastName,
    data.email, data.password,
    response => res.send(response),
    error => errorHandler("Error creating an account", error, res));
});

// Change password
app.post('/changepassword', (req, res) => {

});

// Add email to mailing list
app.post('/subscribe', (req, res) => {
  let data = req.body;
  functionHandler.getMailingListHandler().addToMailingList(data.email,
    response => res.send(response),
    error => errorHandler("Error subscribing to mailing list", error, res));
});

// Remove email from mailing list
app.post('/unsubscribe', (req, res) => {
  let data = req.body;
  functionHandler.getMailingListHandler().removeFromMailingList(data.email,
    response => res.send(response),
    error => errorHandler("Error unsubscribing from mailing list", error, res));
});

// Get response
app.post('/getresponse', (req, res) => {
  let data = req.body;
  functionHandler.getResponseHandler().getResponse(data.token, data.phrase,
    response => res.send(response),
    error => errorHandler("Error getting response", error, res));
});

// Get all phrases a user has
app.post('/getphrases', (req, res) => {
  let data = req.body;
  functionHandler.getResponseHandler().getPhrases(data.token,
    response => res.send(response),
    error => errorHandler("Error getting response", error, res));
});

// Add response
app.post('/addresponse', (req, res) => {
  let data = req.body;
  functionHandler.getResponseHandler().addResponse(data.token, data.phrase,
    data.response,
    response => res.send(response),
    error => errorHandler("Error adding a response", error, res));
});

// Remove response
app.post('/removeresponse', (req, res) => {
  let data = req.body;
  functionHandler.getResponseHandler().removeResponse(data.token, data.response,
    response => res.send(response),
    error => errorHandler("Error removing a response", error, res));
});

// Start express server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Express server listening at http://%s:%s', host, port);
});
