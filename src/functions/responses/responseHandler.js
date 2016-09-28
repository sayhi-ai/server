import jwtDecode from 'jwt-decode';

export default class {
  constructor(functionHandler, serviceHandler) {
    this.gcClient = serviceHandler.getGCClient();
  }

  getResponse(token, phrase, persona, successFunc, errorFunc) {
    let query = {
      data: `
        query {
          allResponses(
            filter: {
              phrase_contains: \\"` + phrase + `\\",
              persona_contains: \\"` + persona + `\\",
            }) {
            id
            response
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
    let responses = gcResponse.data.allResponses;
    let index = Math.floor(Math.random() * responses.length);
    callbackFunc(responses[index].response);
  }

  addResponse(token, phrase, persona, response, successFunc, errorFunc) {
    let decodedToken = jwtDecode(token);
    let query = {
      data: `
        mutation {
          createResponse(
            userId: \\"` + decodedToken.userId + `\\",
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
