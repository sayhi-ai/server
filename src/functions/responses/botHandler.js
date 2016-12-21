import jwtDecode from "jwt-decode";
import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.phraseHandler = functionHandler.getPhraseHandler();
    this.gcClient = clientsHandler.getGCClient();
  }

  getBots(token, successFunc, errorFunc) {
    let decodedToken = jwtDecode(token);
    logger.debug("Getting all bots for user: " + decodedToken.userId + "..");
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
      logger.debug("Got all bots for user: " + decodedToken.userId + ".");
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
    logger.debug("Adding a bot with name:" + name + ", type:" + type +
      ", description:" + description + "..");
    if (name === "" || name.length >
      ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH) {
      let errorObj = {
        file: "botHandler.js",
        method: "addBot",
        code: 400,
        error: "",
        message: "Length of name must be between 0 and " +
          ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH + "."
      };

      return errorFunc(errorObj);
    }

    if (type === "" || type.length >
      ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH) {
      let errorObj = {
        file: "botHandler.js",
        method: "addBot",
        code: 400,
        error: "",
        message: "Length of type must be between 0 and " +
        ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH + "."
      };

      return errorFunc(errorObj);
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
        logger.debug("No bot with the given information exists for user: " +
          decodedToken.userId + ", creating a new one.");
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
      logger.debug("Created new bot. Linking it with user..");
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
        logger.warn("Did not link bot because a connection already exists " +
          "between user and bot.");
        successFunc(JSON.stringify({added: false}));
      } else {
        let botId = response.data.addToUserBotRelation.botsBot.id;
        logger.debug("Linked bot with user successfully.");
        successFunc(JSON.stringify({added: true, id: botId}));
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

  removeBot(token, botId, successFunc, errorFunc) {
    logger.debug("Preparing to remove bot: " + botId + "..");
    this._removePhrasesFromBot(token, botId,
      response => this._removeBot(token, botId, successFunc, errorFunc),
      errorFunc);
  }

  _removePhraseResponsesRecursive(token, phrases, successFunc, errorFunc) {
    if (phrases.length === 0) {
      return successFunc();
    }
    const phrase = phrases.pop();
    const context = this;
    const promise = new Promise((resolve, reject) =>
      context.phraseHandler._removeResponsesFromPhrase(token, phrase.id,
        resolve, reject));

    promise.then(result =>
      this._removePhraseResponsesRecursive(token, phrases, successFunc,
        errorFunc));
  }

  _removePhrasesFromBot(token, botId, successFunc, errorFunc) {
    logger.debug("Removing phrases from bot: " + botId + "..");
    let query = {
      data: `
        query {
          Bot(id: \\"` + botId + `\\") {
            phrases {
              id
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, responseGc => {
      let phrases = responseGc.data.Bot.phrases;

      let promise = new Promise((resolve, reject) =>
        this._removePhraseResponsesRecursive(token, phrases.slice(), resolve,
          reject));

      promise
        .then(result => {
          phrases = phrases.map(phrase => {
            const context = this;
            return new Promise((resolve, reject) =>
              context.phraseHandler._removePhrase(token, phrase.id, resolve,
                reject));
          });

          return Promise.all(phrases);
        })
        .then(result => successFunc(result))
        .catch(error => {
          let errorObj = {
            file: "botHandler.js",
            method: "_removePhrasesFromBot",
            code: 500,
            error: error,
            message: "Unable to remove bot: " + botId + "."
          };

          return errorFunc(errorObj);
        });
    }, errorFunc);
  }

  _removeBot(token, botId, successFunc, errorFunc) {
    let query = {
      data: `
          mutation {
            deleteBot(id: \\"` + botId + `\\") {
              id
            }
          }`,
      token: token
    };

    this.gcClient.query(query, response => {
      if (response.data.deleteBot === null) {
        logger.warn("Did not remove bot.");
        successFunc(JSON.stringify({removed: false}));
      } else {
        logger.debug("Removed bot.");
        successFunc(JSON.stringify({removed: true}));
      }
    }, error => {
      let errorObj = {
        file: "botHandler.js",
        method: "_removeBot",
        code: 500,
        error: error,
        message: "Unable to remove bot: " + botId + "."
      };

      return errorFunc(errorObj);
    });
  }
}
