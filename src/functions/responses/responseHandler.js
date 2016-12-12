import jwtDecode from "jwt-decode";
import ENV_VARS from "../../ENV_VARS"

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
  }

  getResponse(token, phrase, persona, personal, successFunc, errorFunc) {
    let query;
    if (personal) {
      let decodedToken = jwtDecode(token);
      query = {
        data: `
        query {
          User(id: \\"` + decodedToken.userId + `\\") {
            responses(
              filter: {
                phrase: \\"` + phrase + `\\",
                persona: \\"` + persona + `\\",
              }
            ) {
              id,
              response
            }
          }
        }`,
        token: token
      };
    } else {
      query = {
        data: `
        query {
          allResponses(
            filter: {
              approved: true,
              phrase: \\"` + phrase + `\\",
              persona: \\"` + persona + `\\",
            }) {
            id
            response
          }
        }`,
        token: token
      };
    }

    this.gcClient.query(query, response => {
      this._chooseResponse(response, personal, successFunc);
    }, error => {
      errorFunc(error);
    });
  }

  _chooseResponse(gcResponse, personal, callbackFunc) {
    let responses;
    if (personal) {
      responses = gcResponse.data.User.responses;
    } else {
      responses = gcResponse.data.allResponses;
    }

    if (responses.length > 0) {
      let index = Math.floor(Math.random() * responses.length);
      callbackFunc(JSON.stringify({response: responses[index].response}));
    } else {
      callbackFunc(JSON.stringify({response: ""}));
    }
  }

  addResponse(token, phrase, persona, response, successFunc, errorFunc) {
    if (phrase === "" || phrase.length >
      ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH) {
      return errorFunc("Length of phrase must be between 0 and " +
        ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH);
    }

    if (persona === "" || persona.length >
      ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH) {
      return errorFunc("Length of persona must be between 0 and " +
        ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH);
    }

    if (response === "" || response.length >
      ENV_VARS.CONSTANTS.MAX_RESPONSE_LENGTH) {
      return errorFunc("Length of response must be between 0 and " +
        ENV_VARS.CONSTANTS.MAX_RESPONSE_LENGTH);
    }

    let query = {
      data: `
        mutation {
          createResponse(
            phrase: \\"` + phrase + `\\",
            persona: \\"` + persona + `\\",
            response: \\"` + response + `\\"
          ) {
            id
          }
        }`,
      token: token
    };

    this.gcClient.query(query, response => {
      this._linkResponseToUser(token, response.data.createResponse.id,
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
          addToURRelation(
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
            removeFromURRelation(
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
