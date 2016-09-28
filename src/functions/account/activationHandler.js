import fs from 'fs';
import ENV_VARS from "../../ENV_VARS";

export default class {
  constructor(functionHandler, serviceHandler) {
    this.gcClient = serviceHandler.getGCClient();
    this.mailClient = serviceHandler.getMailClient();
  }

  sendActivationRequest(email, userId, firstName, successFunc, errorFunc) {
    let activationCode = this._generateActivationCode();
    let activationLink = ENV_VARS.BASE_URL + '/activate?code=' + activationCode;
    let vars = [firstName, activationLink];
    this._sendWelcomeMail(email, vars,
      () => this._saveActivationCode(userId, activationCode,
        successFunc, errorFunc)
      , errorFunc);
  }

  activateAccount(code, successFunc, errorFunc) {
    let query = {
      data: `
        query {
          Activation(code: \\"` + code + `\\") {
            id
            userId
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      this._updateAccountStatus(response.data.Activation.userId,
        () => this._deleteActivationObject(response.data.Activation.id,
          successFunc, errorFunc),
        errorFunc);
    }, error => {
      errorFunc(error);
    });
  }

  _updateAccountStatus(id, successFunc, errorFunc) {
    let query = {
      data: `
          mutation {
            updateUser(id: \\"` + id + `\\",
            activated: true) {
              id
            }
          }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      successFunc(response);
    }, error => {
      errorFunc(error);
    });
  }

  _deleteActivationObject(id, successFunc, errorFunc) {
    let query = {
      data: `
          mutation {
            deleteActivation(id: \\"` + id + `\\") {
              id
            }
          }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      successFunc(response);
    }, error => {
      errorFunc(error);
    });
  }

  _saveActivationCode(userId, code, successFunc, errorFunc) {
    var dateObj = new Date();
    var dateMilli = dateObj.getTime();

    let query = {
      data: `
        mutation {
          createActivation(
            userId: \\"` + userId + `\\"
            code: \\"` + code + `\\"
            date: \\"` + dateMilli + `\\"
          ) {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      successFunc(response);
    }, error => {
      errorFunc(error);
    });
  }

  _sendWelcomeMail(email, vars, successFunc, errorFunc) {
    fs.readFile(process.cwd() + "/" + ENV_VARS.ROOT +
      '/welcome-email.html', 'utf8', (error, html) => {
        if (error) {
          errorFunc(error);
        } else {
          let htmlFinal = this.mailClient.processHTMLString(html, vars);
          this.mailClient.sendMail(email, "Welcome to sayHi.ai!",
            htmlFinal, successFunc, errorFunc);
        }
      }
    );
  }

  _generateActivationCode() {
    let code = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123" +
      "456789";

    for (let i = 0; i < 60; i++) {
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return code;
  }
}
