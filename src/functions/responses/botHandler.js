import jwtDecode from "jwt-decode";
import ENV_VARS from "../../ENV_VARS";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
  }

  getBotId(token, botName, successFunc, errorFunc) {
    let decodedToken = jwtDecode(token);
    let query = {
      data: `
        query {
          User(id: \\"` + decodedToken.userId + `\\") {
            bots(filter: {name: \\"` + botName + `\\"}) {
              id
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, response => {
      if (response.data.User.bots.length !== 1) {
        return errorFunc("Error identifying bot with name: " + botName);
      }
      let botId = response.data.User.bots[0].id;
      successFunc(JSON.stringify({id: botId}));
    }, error => errorFunc(error));
  }

  getBots(token, successFunc, errorFunc) {
    let decodedToken = jwtDecode(token);
    let query = {
      data: `
        query {
          User(id: \\"` + decodedToken.userId + `\\") {
            bots {
              id,
              name
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, response => {
      let bots = response.data.User.bots;
      successFunc(JSON.stringify({bots: bots}));
    }, error => errorFunc(error));
  }

  addBot(token, name, type, description, successFunc, errorFunc) {
    if (name === "" || name.length >
      ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH) {
      return errorFunc("Length of name must be between 0 and " +
        ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH);
    }

    if (type === "" || type.length >
      ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH) {
      return errorFunc("Length of type must be between 0 and " +
        ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH);
    }

    if (description === null) {
      description = "";
    }

    let decodedToken = jwtDecode(token);

    let query = {
      data: `
        query {
          User(id: \\"` + decodedToken.userId + `\\") {
            bots(filter: {name: \\"` + name + `\\"}) {
              id
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, responseQl => {
      let bots = responseQl.data.User.bots;
      if (bots.length === 0) {
        this._createNewBot(token, name, type, description,
          successFunc, errorFunc);
      } else {
        errorFunc("A bot with this name already exists");
      }
    }, error => {
      errorFunc(error);
    });
  }

  _createNewBot(token, name, type, description, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          createBot(
            name: \\"` + name + `\\",
            type: \\"` + type + `\\",
            description: \\"` + description + `\\"
          ) {
            id
          }
        }`,
      token: token
    };

    this.gcClient.query(query, responseQl => {
      this._linkBotWithUser(token, responseQl.data.createBot.id,
        successFunc, errorFunc);
    }, error => {
      errorFunc(error);
    });
  }

  linkBotWithUser(token, botId, successFunc, errorFunc) {
    let decodedToken = jwtDecode(token);

    let query = {
      data: `
        query {
          User(id: \\"` + decodedToken.userId + `\\") {
            bots(filter: {id: \\"` + botId + `\\"}) {
              id
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, responseQl => {
      let bots = responseQl.data.User.bots;
      if (bots.length === 0) {
        this._linkBotWithUser(token, botId, successFunc, errorFunc);
      } else {
        errorFunc("A bot with this name already exists");
      }
    }, error => {
      errorFunc(error);
    });
  }

  _linkBotWithUser(token, botId, successFunc, errorFunc) {
    let decodedToken = jwtDecode(token);

    let query = {
      data: `
        mutation {
          addToUserBotRelation(
            usersUserId: \\"` + decodedToken.userId + `\\",,
            botsBotId: \\"` + botId + `\\",
          ) {
            usersUser {
              id
            }
            botsBot {
              id
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, response => {
      if (response.data.addToUserBotRelation === null) {
        successFunc(JSON.stringify({added: false}));
      } else {
        successFunc(JSON.stringify({added: true}));
      }
    }, error => {
      errorFunc(error);
    });
  }

  removeBot(token, botName, successFunc, errorFunc) {

  }
}
