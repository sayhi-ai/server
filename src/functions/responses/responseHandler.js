import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
  }

  getResponses(token, botId, phraseId, successFunc, errorFunc) {
    logger.debug("Getting responses for phrase: " + phraseId + "..");
    this._getResponses(token, botId, phraseId,
      response => successFunc(JSON.stringify({responses: response})),
      errorFunc);
  }

  getResponse(token, botId, phraseId, successFunc, errorFunc) {
    logger.debug("Getting a response for phrase: " + phraseId + "..");
    this._getResponses(token, botId, phraseId,
      response => this._chooseResponse(response, successFunc),
      errorFunc);
  }

  _getResponses(token, botId, phraseId, successFunc, errorFunc) {
    let query = {
      data: `
        query {
          Bot(id: \\"` + botId + `\\") {
            phrases(filter: {id: \\"` + phraseId + `\\"}) {
              responses {
                response
              }
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, response => {
      let responses = [];
      response.data.Bot.phrases[0].responses.forEach(response =>
        responses.push(response.response));
      logger.debug("Got responses for phrase: " + phraseId + ".");
      successFunc(responses);
    }, error => {
      let errorObj = {
        file: "responseHandler.js",
        method: "_getResponses",
        code: 400,
        error: error,
        message: "Unable to get responses for phrase: " + phraseId + "."
      };

      return errorFunc(errorObj);
    });
  }

  _chooseResponse(responses, successFunc) {
    if (responses.length > 0) {
      let index = Math.floor(Math.random() * responses.length);
      logger.debug("Chose a response.");
      successFunc(JSON.stringify({response: responses[index]}));
    } else {
      logger.warn("No responses found to choose from.");
      successFunc(JSON.stringify({response: ""}));
    }
  }

  addResponse(token, phraseId, response, successFunc, errorFunc) {
    logger.debug("Adding a response to phrase: " + phraseId + "..");
    if (response === "" || response.length >
      ENV_VARS.CONSTANTS.MAX_RESPONSE_LENGTH) {
      let errorObj = {
        file: "responseHandler.js",
        method: "addResponse",
        code: 400,
        error: "",
        message: "Length of response must be between 0 and " +
          ENV_VARS.CONSTANTS.MAX_RESPONSE_LENGTH + "."
      };

      return errorFunc(errorObj);
    }

    let query = {
      data: `
        query {
          allResponses(filter: {response: \\"` + response + `\\"}) {
            id
          }
        }`,
      token: token
    };
    this.gcClient.query(query, responseQl => {
      let responses = responseQl.data.allResponses;
      if (responses.length === 0) {
        logger.debug("Creating a new response: " + response + "..");
        this._createNewResponse(token, phraseId, response,
          successFunc, errorFunc);
      } else if (responses.length === 1) {
        logger.debug("Response exists already, linking response: " +
          response + " to phrase: " + phraseId + "..");
        this._linkResponseToPhrase(token, phraseId, responses[0].id,
          successFunc, errorFunc);
      } else {
        let errorObj = {
          file: "responseHandler.js",
          method: "addResponse",
          code: 400,
          error: "",
          message: "Duplicate response found."
        };

        return errorFunc(errorObj);
      }
    }, error => {
      let errorObj = {
        file: "responseHandler.js",
        method: "addResponse",
        code: 400,
        error: error,
        message: "Unable to check if response exists already."
      };

      return errorFunc(errorObj);
    });
  }

  _createNewResponse(token, phraseId, response, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          createResponse(response: \\"` + response + `\\") {
            id
          }
        }`,
      token: token
    };

    this.gcClient.query(query, responseQl => {
      logger.debug("Response created, linking response: " +
        response + " to phrase: " + phraseId + "..");
      this._linkResponseToPhrase(token, phraseId,
        responseQl.data.createResponse.id, successFunc, errorFunc);
    }, error => {
      let errorObj = {
        file: "responseHandler.js",
        method: "_createNewResponse",
        code: 400,
        error: error,
        message: "Unable to create new response: " + response + "."
      };

      return errorFunc(errorObj);
    });
  }

  _linkResponseToPhrase(token, phraseId, responseId, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          addToPhraseResponseRelation(
            phrasesPhraseId: \\"` + phraseId + `\\",
            responsesResponseId: \\"` + responseId + `\\"
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

    this.gcClient.query(query, response => {
      if (response.data.addToPhraseResponseRelation === null) {
        logger.warn("Did not link response because a connection already " +
          "exists between phrase and response.");
        successFunc(JSON.stringify({added: false}));
      } else {
        let responseId = response.data.addToPhraseResponseRelation.
          responsesResponse.id;
        logger.debug("Linked response: " + responseId + " with phrase: " +
          phraseId + "successfully.");
        successFunc(JSON.stringify({added: true, id: responseId}));
      }
    }, error => {
      let errorObj = {
        file: "responseHandler.js",
        method: "_linkResponseToPhrase",
        code: 400,
        error: error,
        message: "Unable to link response: " + responseId + " to phrase: " +
          phraseId + "."
      };

      return errorFunc(errorObj);
    });
  }

  removeResponse(token, phraseId, response, successFunc, errorFunc) {
    logger.debug("Removing response: " + response + " from phrase: " +
      phraseId + ".");

    let query = {
      data: `
        query {
          Phrase(id: \\"` + phraseId + `\\") {
            responses(
              filter: {
                response: \\"` + response + `\\"
              }
            ) {
              id,
              phrases {
                id
              }
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, responseGc => {
      let responses = responseGc.data.Phrase.responses;

      if (responses.length === 1) {
        logger.debug("Response found to remove.");
        this._removeResponse(token, phraseId, responses[0], successFunc,
          errorFunc);
      } else {
        let errorObj = {
          file: "responseHandler.js",
          method: "removeResponse",
          code: 400,
          error: "",
          message: "No or duplicate response found."
        };

        return errorFunc(errorObj);
      }
    }, error => {
      let errorObj = {
        file: "responseHandler.js",
        method: "removeResponse",
        code: 400,
        error: error,
        message: "Unable to find response to remove for phrase: " + phraseId +
         "."
      };

      return errorFunc(errorObj);
    });
  }

  _removeResponse(token, phraseId, response, successFunc, errorFunc) {
    let query;
    if (response.phrases.length > 1) {
      query = {
        data: `
          mutation {
            removeFromPhraseResponseRelation(
              phrasesPhraseId: \\"` + phraseId + `\\",
              responsesResponseId: \\"` + response.id + `\\"
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
    } else {
      query = {
        data: `
          mutation {
            deleteResponse(id: \\"` + response.id + `\\") {
              id
            }
          }`,
        token: token
      };
    }

    this.gcClient.query(query, response => {
      if (response.data.removeFromPhraseResponseRelation === null ||
          response.data.deleteResponse === null) {
        logger.warn("Did not remove response.");
        successFunc(JSON.stringify({removed: false}));
      } else {
        logger.debug("Removed response.");
        successFunc(JSON.stringify({removed: true}));
      }
    }, error => {
      let errorObj = {
        file: "responseHandler.js",
        method: "_removeResponse",
        code: 500,
        error: error,
        message: "Unable to remove response: " + response + "."
      };

      return errorFunc(errorObj);
    });
  }
}
