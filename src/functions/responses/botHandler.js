import jwtDecode from "jwt-decode";
import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
  }

  getBotId(token, botName, successFunc, errorFunc) {
    logger.debug("Getting id for bot: " + botName + "..");
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
        let errorObj = {
          file: "botHandler.js",
          method: "getBotId",
          code: 400,
          error: "",
          message: "Error identifying bot with name: " + botName + "."
        };

        return errorFunc(errorObj);
      }

      let botId = response.data.User.bots[0].id;
      logger.debug("Got id for bot: " + botName + ".");
      successFunc(JSON.stringify({id: botId}));
    }, error => {
      let errorObj = {
        file: "botHandler.js",
        method: "getBotId",
        code: 400,
        error: error,
        message: "Error getting id for bot with name: " + botName + "."
      };

      return errorFunc(errorObj);
    });
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
    }, error => {
      let errorObj = {
        file: "botHandler.js",
        method: "getBots",
        code: 400,
        error: error,
        message: "Error getting bots for user: " + decodedToken.userId + "."
      };

      return errorFunc(errorObj);
    });
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
        let errorObj = {
          file: "botHandler.js",
          method: "addBot",
          code: 400,
          error: "",
          message: "A bot with this name already exists."
        };

        return errorFunc(errorObj);
      }
    }, error => {
      let errorObj = {
        file: "botHandler.js",
        method: "addBot",
        code: 400,
        error: error,
        message: "Error adding bot."
      };

      return errorFunc(errorObj);
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
      let errorObj = {
        file: "botHandler.js",
        method: "_createNewBot",
        code: 500,
        error: error,
        message: "Error creating a new bot."
      };

      return errorFunc(errorObj);
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
        let errorObj = {
          file: "botHandler.js",
          method: "linkBotWithUser",
          code: 400,
          error: "",
          message: "A bot with this name already exists."
        };

        return errorFunc(errorObj);
      }
    }, error => {
      let errorObj = {
        file: "botHandler.js",
        method: "linkBotWithUser",
        code: 400,
        error: error,
        message: "Error finding bots for user to link with."
      };

      return errorFunc(errorObj);
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
      let errorObj = {
        file: "botHandler.js",
        method: "_linkBotWithUser",
        code: 500,
        error: error,
        message: "Error linking bot: " + botId + " with user: " +
          decodedToken.userId + "."
      };

      return errorFunc(errorObj);
    });
  }

  removeBot(token, botName, successFunc, errorFunc) {

  }
}
