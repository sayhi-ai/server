import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
  }

  getPhraseId(token, botId, phrase, successFunc, errorFunc) {
    logger.debug("Getting phraseId for phrase: " + phrase + " from bot: " +
      botId);
    let query = {
      data: `
        query {
          Bot(id: \\"` + botId + `\\") {
            phrases(filter: {phrase: \\"` + phrase + `\\"}) {
              id
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, response => {
      if (response.data.User.bots.length !== 1) {
        let errorObj = {
          file: "phraseHandler.js",
          method: "getPhraseId",
          code: 400,
          error: "",
          message: "Error identifying phrase: " + phrase + "."
        };

        return errorFunc(errorObj);
      }

      let phraseId = response.data.Bot.phrases[0].id;
      logger.debug("Successfully got phraseId.");
      successFunc(JSON.stringify({id: phraseId}));
    }, error => {
      let errorObj = {
        file: "phraseHandler.js",
        method: "getPhraseId",
        code: 400,
        error: error,
        message: "Unable to get phraseId."
      };

      return errorFunc(errorObj);
    });
  }

  getPhrases(token, botId, successFunc, errorFunc) {
    logger.debug("Getting all phrases for bot: " + botId);

    let query = {
      data: `
        query {
          Bot(id: \\"` + botId + `\\") {
            phrases {
              id,
              phrase
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, response => {
      let phrases = [];
      response.data.Bot.phrases.forEach(phrase =>
        phrases.push({id: phrase.id, phrase: phrase.phrase}));
      logger.debug("Got all phrases for bot: " + botId);
      successFunc(JSON.stringify({phrases: phrases}));
    }, error => {
      let errorObj = {
        file: "phraseHandler.js",
        method: "getPhrases",
        code: 400,
        error: error,
        message: "Unable to get all phrases for bot: " + botId + "."
      };

      return errorFunc(errorObj);
    });
  }

  addPhrase(token, botId, phrase, successFunc, errorFunc) {
    logger.debug("Adding a phrase to bot: " + botId);
    if (phrase === "" ||
      phrase.length > ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH) {
      let errorObj = {
        file: "phraseHandler.js",
        method: "addPhrase",
        code: 400,
        error: "",
        message: "Length of phrase must be between 0 and " +
          ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH + "."
      };

      return errorFunc(errorObj);
    }

    if (phrase.includes(ENV_VARS.CONSTANTS.RESPONSE_VARIABLE)) {
      let errorObj = {
        file: "phraseHandler.js",
        method: "addPhrase",
        code: 400,
        error: "",
        message: ENV_VARS.CONSTANTS.RESPONSE_VARIABLE + " not allowed " +
          "in phrase."
      };

      return errorFunc(errorObj);
    }

    let query = {
      data: `
        query {
          Bot(id: \\"` + botId + `\\") {
            phrases(filter: {phrase: \\"` + phrase + `\\"}) {
              id
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, responseQl => {
      let phrases = responseQl.data.Bot.phrases;
      if (phrases.length === 0) {
        logger.debug("Phrase does not exists for bot: " + botId +
          ", creating a new one.");
        this._createNewPhrase(token, botId, phrase, successFunc, errorFunc);
      } else {
        let errorObj = {
          file: "phraseHandler.js",
          method: "addPhrase",
          code: 400,
          error: "",
          message: "Duplicate phrase found."
        };

        return errorFunc(errorObj);
      }
    }, error => errorFunc(error));
  }

  _createNewPhrase(token, botId, phrase, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          createPhrase(phrase: \\"` + phrase + `\\") {
            id
          }
        }`,
      token: token
    };

    this.gcClient.query(query, responseQl => {
      logger.debug("Created phrase for bot: " + botId +
        ", linking phrase with the bot now..");
      this._linkPhraseToBot(token, botId, responseQl.data.createPhrase.id,
        successFunc, errorFunc);
    }, error => {
      let errorObj = {
        file: "phraseHandler.js",
        method: "_createNewPhrase",
        code: 400,
        error: error,
        message: "Unable to create new phrase."
      };

      return errorFunc(errorObj);
    });
  }

  _linkPhraseToBot(token, botId, phraseId, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          addToBotPhraseRelation(
            botsBotId: \\"` + botId + `\\",
            phrasesPhraseId: \\"` + phraseId + `\\"
          ) {
            botsBot {
              id
            },
            phrasesPhrase {
              id
            }
          }
        }`,
      token: token
    };

    this.gcClient.query(query, response => {
      if (response.data.addToBotPhraseRelation === null) {
        logger.warn("Did not link phrase because a connection already " +
          "exists between bot and phrase.");
        successFunc(JSON.stringify({added: false}));
      } else {
        let phraseId = response.data.addToBotPhraseRelation.phrasesPhrase.id;
        logger.debug("Linked phrase: " + phraseId + " with bot: " +
          botId + "successfully.");
        successFunc(JSON.stringify({added: true, id: phraseId}));
      }
    }, error => {
      let errorObj = {
        file: "phraseHandler.js",
        method: "_linkPhraseToBot",
        code: 400,
        error: error,
        message: "Unable to link phrase: " + phraseId + " to bot: " + botId +
          "."
      };

      return errorFunc(errorObj);
    });
  }

  removePhrase(token, botName, phrase, successFunc, errorFunc) {

  }
}