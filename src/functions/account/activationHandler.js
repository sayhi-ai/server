import fs from 'fs';
import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
    this.mailClient = clientsHandler.getMailClient();
  }

  sendActivationRequest(email, userId, firstName, successFunc, errorFunc) {
    logger.debug("Sending activation request to " + email + "..");

    let activationCode = this._generateActivationCode();
    let activationLink = ENV_VARS.BASE_URL + '/account/activate?code='
      + activationCode;
    let vars = [firstName, activationLink];
    this._sendWelcomeMail(email, vars,
      () => this._saveActivationCode(userId, activationCode, successFunc,
        errorFunc), errorFunc);
  }

  activateAccount(code, successFunc, errorFunc) {
    logger.debug("Request to activate account received.");

    let query = {
      data: `
        query {
          Activation(code: \\"` + code + `\\") {
            id,
            user {
              id
            }
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      this._updateAccountStatus(response.data.Activation.user.id,
        () => this._deleteActivationObject(response.data.Activation.id,
          successFunc, errorFunc),
        errorFunc);
    }, error => {
      let errorObj = {
        file: "activationHandler.js",
        method: "activateAccount",
        code: 400,
        error: error,
        message: "Unable to activate account. Wrong or old link maybe?"
      };

      errorFunc(errorObj);
    });
  }

  _updateAccountStatus(id, successFunc, errorFunc) {
    let query = {
      data: `
          mutation {
            updateUser(id: \\"` + id + `\\", roles: AUTH) {
              id
            }
          }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      logger.debug("Account status updated to AUTH for user: " + id);
      successFunc(response);
    }, error => {
      let errorObj = {
        file: "activationHandler.js",
        method: "_updateAccountStatus",
        code: 500,
        error: error,
        message: "Unable to update account status."
      };

      errorFunc(errorObj);
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
      logger.debug("Activation object deleted");
      successFunc(response);
    }, error => {
      let errorObj = {
        file: "activationHandler.js",
        method: "_deleteActivationObject",
        code: 500,
        error: error,
        message: "Unable to delete activation object."
      };

      errorFunc(errorObj);
    });
  }

  _saveActivationCode(userId, code, successFunc, errorFunc) {
    let time = new Date().getTime();
    let date = new Date(time);
    let dateISO = date.toISOString();

    let query = {
      data: `
        mutation {
          createActivation(
            code: \\"` + code + `\\"
            date: \\"` + dateISO + `\\"
          ) {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      logger.debug("Activation code saved for user: " + userId + ".");
      this._linkActivationToUser(userId, response.data.createActivation.id,
        successFunc, errorFunc);
    }, error => {
      let errorObj = {
        file: "activationHandler.js",
        method: "_saveActivationCode",
        code: 500,
        error: error,
        message: "Unable to save activation code."
      };

      errorFunc(errorObj);
    });
  }

  _linkActivationToUser(userId, activationId, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          setUserActivationRelation(
            userUserId: \\"` + userId + `\\"
            activationActivationId: \\"` + activationId + `\\"
          ) {
            userUser{
              id
            }
            activationActivation {
              id
            }
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      logger.debug("Activation code linked with user: " + userId + ".");
      successFunc(response);
    }, error => {
      let errorObj = {
        file: "activationHandler.js",
        method: "_linkActivationToUser",
        code: 500,
        error: error,
        message: "Unable to link activation object with user object."
      };

      errorFunc(errorObj);
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

    logger.debug("Activation email sent to " + email + ".");
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
