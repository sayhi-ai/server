import jwtDecode from "jwt-decode";
import ENV_VARS from "../../ENV_VARS"

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
  }

  getPhrases(token, successFunc, errorFunc) {
    let decodedToken = jwtDecode(token);
    let query = {
      data: `
      query {
        User(id: \\"` + decodedToken.userId + `\\") {
          responses(
            filter: {
              phrase: \\"` + phrase + `\\",
            }
          ) {
            id,
            response
          }
        }
      }`,
      token: token
    };

    this.gcClient.query(query, response => {
      this._chooseResponse(response, successFunc);
    }, error => {
      errorFunc(error);
    });
  }

  getResponse(token, phrase, successFunc, errorFunc) {
    let decodedToken = jwtDecode(token);
    let query = {
      data: `
      query {
        User(id: \\"` + decodedToken.userId + `\\") {
          responses(
            filter: {
              phrase: \\"` + phrase + `\\",
            }
          ) {
            id,
            response
          }
        }
      }`,
      token: token
    };

    this.gcClient.query(query, response => {
      this._chooseResponse(response, successFunc);
    }, error => {
      errorFunc(error);
    });
  }

  _chooseResponse(gcResponse, callbackFunc) {
    let responses = gcResponse.data.User.responses;

    if (responses.length > 0) {
      let index = Math.floor(Math.random() * responses.length);
      callbackFunc(JSON.stringify({response: responses[index].response}));
    } else {
      callbackFunc(JSON.stringify({response: ""}));
    }
  }

  addResponse(token, phrase, response, successFunc, errorFunc) {
    if (phrase === "" ||
      phrase.length > ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH) {
      return errorFunc("Length of phrase must be between 0 and " +
        ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH);
    }

    if (response === "" || response.length >
      ENV_VARS.CONSTANTS.MAX_RESPONSE_LENGTH) {
      return errorFunc("Length of response must be between 0 and " +
        ENV_VARS.CONSTANTS.MAX_RESPONSE_LENGTH);
    }

    if (phrase.includes(ENV_VARS.CONSTANTS.RESPONSE_VARIABLE)) {
      return errorFunc(ENV_VARS.CONSTANTS.RESPONSE_VARIABLE + " not allowed " +
        "in phrase");
    }

    let query = {
      data: `
        query {
          allResponses(
            filter: {
              phrase: \\"` + phrase + `\\",
              response: \\"` + response + `\\"
            }
          ) {
            id
          }
        }`,
      token: token
    };
    this.gcClient.query(query, responseQl => {
      if (responseQl.data.allResponses.length === 0) {
        this._createNewResponse(token, phrase, response,
          successFunc, errorFunc);
      } else {
        this._linkResponseToUser(token, responseQl.data.allResponses[0].id,
          successFunc, errorFunc);
      }
    }, error => {
      errorFunc(error);
    });
  }

  _createNewResponse(token, phrase, response, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          createResponse(
            phrase: \\"` + phrase + `\\",
            response: \\"` + response + `\\"
          ) {
            id
          }
        }`,
      token: token
    };

    this.gcClient.query(query, responseQl => {
      this._linkResponseToUser(token, responseQl.data.createResponse.id,
        successFunc, errorFunc);
    }, error => {
      errorFunc(error);
    });
  }

  _linkResponseToUser(token, responseId, successFunc, errorFunc) {
    let decodedToken = jwtDecode(token);

    let query = {
      data: `
        mutation {
          addToUserResponsesRelation(
            userUserId: \\"` + decodedToken.userId + `\\",
            responsesResponseId: \\"` + responseId + `\\"
          ) {
            userUser {
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
      successFunc(response);
    }, error => {
      errorFunc(error);
    });
  }

  removeResponse(token, response, successFunc, errorFunc) {
    let decodedToken = jwtDecode(token);

    let query = {
      data: `
        query {
          User(id: \\"` + decodedToken.userId + `\\") {
            responses(
              filter: {
                response: \\"` + response + `\\"
              }
            ) {
              id,
              approved,
              user {
                id
              }
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, responseGc => {
      let responses = responseGc.data.User.responses;
      responses.forEach(toRemove => this._removeResponseCall(token, toRemove,
        () => console.log("Removed response: " + toRemove.id), errorFunc));
      successFunc(JSON.stringify({
        response: "Removed all responses that match: " + response
      }));
    }, error => {
      errorFunc(error);
    });
  }

  _removeResponseCall(token, response, successFunc, errorFunc) {
    let decodedToken = jwtDecode(token);

    let query;
    if (response.user.length > 1 ||
      (response.user[0].id === decodedToken.userId && response.approved)) {
      query = {
        data: `
          mutation {
            removeFromUserResponsesRelation(
              userUserId: \\"` + decodedToken.userId + `\\",
              responsesResponseId: \\"` + response.id + `\\"
            ) {
              userUser {
                id
              }
              responsesResponse {
                id
              }
            }
          }`,
        token: token
      };
    } else if (response.user[0].id === decodedToken.userId) {
      query = {
        data: `
          mutation {
            deleteResponse(id: \\"` + response.id + `\\") {
              id
            }
          }`,
        token: token
      };
    } else {
      return errorFunc("False owner of response");
    }

    this.gcClient.query(query, response => {
      successFunc(response);
    }, error => {
      errorFunc(error);
    });
  }
}
