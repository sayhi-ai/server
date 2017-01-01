require('es6-promise').polyfill();
import express from "express";
import bodyParser from "body-parser";
import * as authorization from 'auth-header';
import morgan from 'morgan';
import FileStreamRotator from 'file-stream-rotator';
import fs from 'fs';
import ClientsHandler from "./clients/clientsHandler";
import FunctionHandler from "./functions/functionHandler";
import ENV_VARS from "./util/ENV_VARS";
import logger from "./util/logger";
import Promise from "bluebird";
const path = require('path');

/* ----------------------------------------------------------------------------
 * Set up
 * ----------------------------------------------------------------------------
 */

// Set up environment
logger.info("Setting up server environment..");
if (!fs.existsSync(ENV_VARS.CONSTANTS.BASE_LOG_DIR)) {
  fs.mkdirSync(ENV_VARS.CONSTANTS.BASE_LOG_DIR);
  fs.mkdirSync(ENV_VARS.CONSTANTS.HTTP_LOG_DIR);
  fs.mkdirSync(ENV_VARS.CONSTANTS.SERVER_LOG_DIR);
}

if (!fs.existsSync(ENV_VARS.CONSTANTS.HTTP_LOG_DIR)) {
  fs.mkdirSync(ENV_VARS.CONSTANTS.HTTP_LOG_DIR);
}

if (!fs.existsSync(ENV_VARS.CONSTANTS.SERVER_LOG_DIR)) {
  fs.mkdirSync(ENV_VARS.CONSTANTS.SERVER_LOG_DIR);
}
logger.info("Server environment set up successfully.");

// Set up HTTP request logging
logger.info("Setting up HTTP logging..");

const accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD', // eslint-disable-line
  filename: path.join(ENV_VARS.CONSTANTS.HTTP_LOG_DIR, 'access-%DATE%.log'),
  frequency: 'daily',
  verbose: false
});

logger.info("HTTP logging set up successfully.");

// Set up express server
logger.info("Setting up express server..");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('combined', {stream: accessLogStream}));
app.use(morgan('dev'));
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', ENV_VARS.CLIENT_URL);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS,' +
    'PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With,' +
    ' Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});
logger.info("Express server set up successfully.");

// Set up handlers
logger.info("Setting up server handlers..");
const clientsHandler = new ClientsHandler();
const functionHandler = new FunctionHandler(clientsHandler);
const errorHandler = (error, errorObj, res) => {
  logger.error(
    "LOCATION: " + errorObj.file + ":" + errorObj.method +
    " MESSAGE: " + error + " - " + errorObj.message +
    " DATA: " + JSON.stringify({errorData: errorObj.error})
  );
  return res.status(errorObj.httpRes).send(JSON.stringify({
    error: error,
    detail: errorObj.message
  }));
};
logger.info("Server handlers set up successfully.");

// Catching promises
Promise.onPossiblyUnhandledRejection(error => logger.error("Uncaught promise: " + error.message));

// Other functions
logger.info("Finishing server set up..");
const extractAuthToken = req => {
  const auth = authorization.parse(req.get('authorization'));
  return auth.token;
};
logger.info("Server set up completed.");

/* ----------------------------------------------------------------------------
 * Account
 * ----------------------------------------------------------------------------
 */

// Activate account
app.get('/account/activate', (req, res) => {
  functionHandler.getActivationHandler().activateAccount(req.query.code)
    .then(response => res.redirect('https://google.com'))
    .catch(error => errorHandler("Error activating account.", error, res));
});

// Login
app.post('/login', (req, res) => {
  const data = req.body;
  functionHandler.getUserHandler().login(data.email, data.password)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error during login.", error, res));
});

// Link account with auth0
app.post('/account/link', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getUserHandler().linkAccountAuth0(data.firstName, data.lastName, token)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error creating an account.", error, res));
});

// Create an account
app.post('/account/create', (req, res) => {
  const data = req.body;
  functionHandler.getUserHandler().addUser(data.firstName, data.lastName, data.email, data.password)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error creating an account.", error, res));
});

// Request password reset code
app.post('/account/password/sendcode', (req, res) => {
  const data = req.body;
  functionHandler.getPasswordResetHandler().sendResetCode(data.email, data.device)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error sending password reset email an account.", error, res));
});

// Reset password
app.post('/account/password/reset', (req, res) => {
  const data = req.body;
  functionHandler.getPasswordResetHandler().resetPassword(data.email, data.code, data.password)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error resetting password.", error, res));
});

// Add email to mailing list
app.post('/account/subscribe', (req, res) => {
  const data = req.body;
  functionHandler.getMailingListHandler().addToMailingList(data.email)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error subscribing to mailing list.", error, res));
});

// Remove email from mailing list
app.post('/account/unsubscribe', (req, res) => {
  const data = req.body;
  functionHandler.getMailingListHandler().removeFromMailingList(data.email)
    .then(response => res.send(response))
    .then(error => errorHandler("Error unsubscribing from mailing list.", error, res));
});

/* ----------------------------------------------------------------------------
 * Bot
 * ----------------------------------------------------------------------------
 */

// Get all bots a user has
app.post('/bot/get', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getBotHandler().getBot(token, data.name)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error getting bot.", error, res));
});

// Get all bots a user has
app.post('/bot/all', (req, res) => {
  const token = extractAuthToken(req);
  functionHandler.getBotHandler().getBots(token)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error getting bots.", error, res));
});

// Add a bot
app.post('/bot/add', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getBotHandler().addBot(token, data.name, data.type, data.description)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error adding bot.", error, res));
});

// Remove a bot
app.post('/bot/remove', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getBotHandler().removeBot(token, data.botId)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error removing bot.", error, res));
});

/* ----------------------------------------------------------------------------
 * Phrase
 * ----------------------------------------------------------------------------
 */

// Get phraseId from phrase of bot
app.post('/phrase/get', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getPhraseHandler().getPhraseId(token, data.botId, data.phrase)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error getting phrase.", error, res));
});

// Get all phrases a user has
app.post('/phrase/all', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getPhraseHandler().getPhrases(token, data.botId)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error getting phrases.", error, res));
});

// Add a phrase
app.post('/phrase/add', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getPhraseHandler().addPhrase(token, data.botId, data.phrase)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error adding phrase.", error, res));
});

// Remove a phrase
app.post('/phrase/remove', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getPhraseHandler().removePhrase(token, data.phraseId)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error removing phrase.", error, res));
});

/* ----------------------------------------------------------------------------
 * Response
 * ----------------------------------------------------------------------------
 */

// Get response
app.post('/response/getplain', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getResponseHandler().getResponse(token, data.phraseId, 'text', data.vars)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error getting response.", error, res));
});

// Get response
app.post('/response/gethtml', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getResponseHandler().getResponse(token, data.phraseId, 'html', data.vars)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error getting response.", error, res));
});

// Get all responses belonging to a phrase
app.post('/response/allplain', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getResponseHandler().getResponses(token, data.phraseId, 'text', data.vars)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error getting responses.", error, res));
});

// Get all responses belonging to a phrase
app.post('/response/allhtml', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getResponseHandler().getResponses(token, data.phraseId, 'html', data.vars)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error getting responses.", error, res));
});

// Add response
app.post('/response/add', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getResponseHandler().addResponse(token, data.phraseId, data.text, data.html, data.vars)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error adding response.", error, res));
});

// Remove response
app.post('/response/remove', (req, res) => {
  const token = extractAuthToken(req);
  const data = req.body;
  functionHandler.getResponseHandler().removeResponse(token, data.phraseId, data.responseId)
    .then(response => res.send(response))
    .catch(error => errorHandler("Error removing response.", error, res));
});

/* ----------------------------------------------------------------------------
 * Server
 * ----------------------------------------------------------------------------
 */

// Start express server
logger.info("Starting server..");
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const host = server.address().address;
  const port = server.address().port;
  logger.info("Server listening at http://" + host + ":" + port + ".");
});
