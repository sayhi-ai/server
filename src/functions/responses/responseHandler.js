import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";
import ErrorHandler from "../../util/errorHandler";
import Promise from "bluebird";

export default class {
  constructor(functionHandler, clientsHandler) {
    this._gcClient = clientsHandler.getGCClient();
    this._errorHandler = new ErrorHandler("responseHandler.js");
  }

  getResponses(token, phraseId) {
    logger.debug("Getting responses for phrase: " + phraseId + "..");
    return this._getResponses(token, phraseId)
      .then(response => JSON.stringify({responses: response}))
      .catch(error => {
        throw error;
      });
  }

  getResponse(token, phraseId, successFunc) {
    logger.debug("Getting a response for phrase: " + phraseId + "..");
    return this._getResponses(token, phraseId)
      .then(response => this._chooseResponse(response, successFunc))
      .catch(error => {
        throw error;
      });
  }

  _getResponses(token, phraseId) {
    const query = {
      query: `
        query {
          Phrase(id: "` + phraseId + `") {
            responses {
              id,
              response
            }
          }
        }`,
      token: token
    };

    return this._gcClient.query(query)
      .then(response => {
        logger.debug("Got responses for phrase: " + phraseId + ".");
        return response.Phrase.responses;
      })
      .catch(error => {
        throw this._errorHandler.create("_getResponses", 400, error, "Unable to get responses for " +
          "phrase: " + phraseId + ".");
      });
  }

  _chooseResponse(responses) {
    if (responses.length > 0) {
      const index = Math.floor(Math.random() * responses.length);
      logger.debug("Chose a response.");
      return JSON.stringify({response: responses[index]});
    }

    logger.warn("No responses found to choose from.");
    return JSON.stringify({response: ""});
  }

  addResponse(token, phraseId, response) {
    logger.debug("Adding a response to phrase: " + phraseId + "..");

    const query = {
      query: `
        query {
          allResponses(filter: {response: "` + response + `"}) {
            id
          }
        }`,
      token: token
    };

    return Promise.resolve()
      .then(() => {
        if (response === "" || response.length > ENV_VARS.CONSTANTS.MAX_RESPONSE_LENGTH) {
          throw this._errorHandler.create("addResponse", 400, "", "Length of response must be between 0 and " +
            ENV_VARS.CONSTANTS.MAX_RESPONSE_LENGTH + ".");
        }
        return "no-op";
      })
      .then(noOp => this._gcClient.query(query))
      .then(responseQl => {
        const responses = responseQl.allResponses;
        if (responses.length === 0) {
          logger.debug("Creating a new response: " + response + "..");
          return this._createNewResponse(token, phraseId, response);
        } else if (responses.length === 1) {
          logger.debug("Response exists already, linking response: " + response + " to phrase: " + phraseId + "..");
          return this._linkResponseToPhrase(token, phraseId, responses[0].id);
        }
        throw this._errorHandler.create("addResponse", 400, "", "Duplicate response found.");
      })
      .catch(error => {
        throw this._errorHandler.create("addResponse", 400, error, "Unable to add a response.");
      });
  }

  _createNewResponse(token, phraseId, response) {
    const query = {
      query: `
        mutation {
          createResponse(response: "` + response + `") {
            id
          }
        }`,
      token: token
    };

    return this._gcClient.query(query)
      .then(responseQl => {
        logger.debug("Response created, linking response: " + response + " to phrase: " + phraseId + "..");
        return this._linkResponseToPhrase(token, phraseId, responseQl.createResponse.id);
      })
      .catch(error => {
        throw this._errorHandler.create("_createNewResponse", 400, error, "Unable to create new " +
          "response: " + response + ".");
      });
  }

  _linkResponseToPhrase(token, phraseId, responseId) {
    const query = {
      query: `
        mutation {
          addToPhraseResponseRelation(
            phrasesPhraseId: "` + phraseId + `",
            responsesResponseId: "` + responseId + `"
          ) {
            phrasesPhrase {
              id
            }
            responsesResponse {
              id
            }
          }
        }`,
      token: token
    };

    return this._gcClient.query(query)
      .then(response => {
        if (response.addToPhraseResponseRelation === null) {
          logger.warn("Did not link response because a connection already exists between phrase and response.");
          return JSON.stringify({added: false});
        }

        const responseId = response.addToPhraseResponseRelation.responsesResponse.id;
        logger.debug("Linked response: " + responseId + " with phrase: " + phraseId + " successfully.");
        return JSON.stringify({added: true, id: responseId});
      })
      .catch(error => {
        throw this._errorHandler.create("_linkResponseToPhrase", 400, error, "Unable to link response: " +
          responseId + " to phrase: " + phraseId + ".");
      });
  }

  removeResponse(token, phraseId, responseId) {
    logger.debug("Removing response: " + responseId + "..");

    const query = {
      query: `
        query {
          Response(id: "` + responseId + `") {
            phrases {
              id
            }
          }
        }`,
      token: token
    };

    return this._gcClient.query(query)
      .then(responseGc => {
        if (responseGc.Response.phrases.length === 1) {
          logger.debug("Response found to remove.");
          return this._removeResponse(token, responseId);
        }

        logger.debug("Response found to unlink from phrase.");
        return this._unlinkResponse(token, phraseId, responseId);
      })
      .catch(error => {
        throw this._errorHandler.create("removeResponse", 400, error, "Unable to find response to remove for phrase: " +
          phraseId + ".");
      });
  }

  _unlinkResponse(token, phraseId, responseId) {
    const query = {
      query: `
        mutation {
          removeFromPhraseResponseRelation(
            phrasesPhraseId: "` + phraseId + `",
            responsesResponseId: "` + responseId + `"
          ) {
            phrasesPhrase {
              id
            }
            responsesResponse {
              id
            }
          }
        }`,
      token: token
    };

    return this._gcClient.query(query)
      .then(response => {
        if (response.removeFromPhraseResponseRelation === null) {
          logger.warn("Did not unlink response.");
          return JSON.stringify({removed: false});
        }

        logger.debug("Unlinked response.");
        return JSON.stringify({removed: true});
      })
      .catch(error => {
        throw this._errorHandler.create("_removeResponse", 500, error, "Unable to remove response: " + responseId + ".");
      });
  }

  _removeResponse(token, responseId) {
    const query = {
      query: `
        mutation {
          deleteResponse(id: "` + responseId + `") {
            id
          }
        }`,
      token: token
    };

    return this._gcClient.query(query)
      .then(response => {
        if (response.deleteResponse === null) {
          logger.warn("Did not remove response.");
          return JSON.stringify({removed: false});
        }

        logger.debug("Removed response.");
        return JSON.stringify({removed: true});
      })
      .catch(error => {
        throw this._errorHandler.create("_removeResponse", 500, error, "Unable to remove response: " + responseId + ".");
      });
  }
}
