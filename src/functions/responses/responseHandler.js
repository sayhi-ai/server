import jwtDecode from "jwt-decode";
import ENV_VARS from "../../ENV_VARS";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
  }

  getResponses(token, botId, phraseId, successFunc, errorFunc) {
    this._getResponses(token, botId, phraseId,
      response => successFunc(JSON.stringify({responses: response})),
      errorFunc);
  }

  getResponse(token, botId, phraseId, successFunc, errorFunc) {
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
      successFunc(responses);
    }, error => errorFunc(error));
  }

  _chooseResponse(responses, successFunc) {
    if (responses.length > 0) {
      let index = Math.floor(Math.random() * responses.length);
      successFunc(JSON.stringify({response: responses[index]}));
    } else {
      successFunc(JSON.stringify({response: ""}));
    }
  }

  addResponse(token, phraseId, response, successFunc, errorFunc) {
    if (response === "" || response.length >
      ENV_VARS.CONSTANTS.MAX_RESPONSE_LENGTH) {
      return errorFunc("Length of response must be between 0 and " +
        ENV_VARS.CONSTANTS.MAX_RESPONSE_LENGTH);
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
        this._createNewResponse(token, phraseId, response,
          successFunc, errorFunc);
      } else if (responses.length === 1) {
        this._linkResponseToPhrase(token, phraseId, responses[0].id,
          successFunc, errorFunc);
      } else {
        errorFunc("Duplicate response found");
      }
    }, error => {
      errorFunc(error);
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
      this._linkResponseToPhrase(token, phraseId,
        responseQl.data.createResponse.id, successFunc, errorFunc);
    }, error => {
      errorFunc(error);
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
        successFunc(JSON.stringify({added: false}));
      } else {
        successFunc(JSON.stringify({added: true}));
      }
    }, error => {
      errorFunc(error);
    });
  }

  removeResponse(token, phraseId, response, successFunc, errorFunc) {
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
        this._removeResponse(token, phraseId, responses[0], successFunc,
          errorFunc);
      } else {
        errorFunc("No or duplicate response found");
      }
    }, error => {
      errorFunc(error);
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
        successFunc(JSON.stringify({removed: false}));
      } else {
        successFunc(JSON.stringify({removed: true}));
      }
    }, error => {
      errorFunc(error);
    });
  }
}
