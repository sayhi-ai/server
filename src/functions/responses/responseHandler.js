import jwtDecode from "jwt-decode";

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
            responses(filter: {
              phrase_contains: \\"` + phrase + `\\",
              persona_contains: \\"` + persona + `\\",
            }) {
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
              phrase_contains: \\"` + phrase + `\\",
              persona_contains: \\"` + persona + `\\",
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
      callbackFunc(responses[index].response);
    } else {
      callbackFunc("no result");
    }
  }

  addResponse(token, phrase, persona, response, successFunc, errorFunc) {
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
    let query = {
      data: `
        query {
          allResponses(
            filter: {
              response_contains: \\"` + response + `\\",
            }) {
            id
          }
        }`,
      token: token
    };

    this.gcClient.query(query, response => {
      let responses = response.data.allResponses;
      responses.forEach(response => this._removeResponseCall(token, response.id,
        () => console.log("Removed response: " + response.id),
        errorFunc));
      successFunc("Removed all responses that match: " + response);
    }, error => {
      errorFunc(error);
    });
  }

  _removeResponseCall(token, id, successFunc, errorFunc) {
    let query = {
      data: `
          mutation {
            deleteResponse(id: \\"` + id + `\\") {
              id
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
}
