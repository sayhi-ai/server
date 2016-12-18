import ENV_VARS from "../../ENV_VARS";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
  }

  getPhraseId(token, botId, phrase, successFunc, errorFunc) {
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
        return errorFunc("Error identifying phrase: " + phrase);
      }

      let phraseId = response.data.Bot.phrases[0].id;
      successFunc(JSON.stringify({id: phraseId}));
    }, error => errorFunc(error));
  }

  getPhrases(token, botId, successFunc, errorFunc) {
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
      let phrases = [{}];
      response.data.Bot.phrases.forEach(phrase =>
        phrases.push({id: phrase.id, phrase: phrase.phrase}));
      successFunc(JSON.stringify({phrases: phrases}));
    }, error => errorFunc(error));
  }

  addPhrase(token, botId, phrase, successFunc, errorFunc) {
    if (phrase === "" ||
      phrase.length > ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH) {
      return errorFunc("Length of phrase must be between 0 and " +
        ENV_VARS.CONSTANTS.MAX_PHRASE_TOKEN_LENGTH);
    }

    if (phrase.includes(ENV_VARS.CONSTANTS.RESPONSE_VARIABLE)) {
      return errorFunc(ENV_VARS.CONSTANTS.RESPONSE_VARIABLE + " not allowed " +
        "in phrase");
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
        this._createNewPhrase(token, botId, phrase, successFunc, errorFunc);
      } else {
        errorFunc("Duplicate phrase found");
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
      this._linkPhraseToBot(token, botId, responseQl.data.createPhrase.id,
        successFunc, errorFunc);
    }, error => errorFunc(error));
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
        successFunc(JSON.stringify({added: false}));
      } else {
        successFunc(JSON.stringify({added: true}));
      }
    }, error => errorFunc(error));
  }

  removePhrase(token, botName, phrase, successFunc, errorFunc) {

  }
}
