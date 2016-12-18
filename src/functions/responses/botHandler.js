import jwtDecode from "jwt-decode";

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

  }

  addBot(token, bot, successFunc, errorFunc) {

  }

  removeBot(token, botName, successFunc, errorFunc) {

  }
}
