import fs from 'fs';
import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
    this.mailClient = clientsHandler.getMailClient();
  }

  sendActivationRequest(email, userId, firstName) {
    logger.debug("Sending activation request to " + email + "..");

    const activationCode = this._generateActivationCode();
    const activationLink = ENV_VARS.BASE_URL + '/account/activate?code=' + activationCode;
    const vars = [firstName, activationLink];

    return this._sendWelcomeMail(email, vars)
      .then(response => this._saveActivationCode(userId, activationCode))
      .then(response => this._linkActivationToUser(userId, response.data.createActivation.id))
      .catch(error => logger.error(this._createErrorObject("sendActivationRequest", 500, error,
        "Unable to create activatio request for user:  " + email)));
  }

  activateAccount(code) {
    logger.debug("Request to activate account received.");

    const query = {
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

    return new Promise((resolve, reject) => {
      this.gcClient.query(query)
        .then(response => this._updateAccountStatus(response.data.Activation))
        .then(id =>  this._deleteActivationObject(id))
        .then(response => resolve(response))
        .catch(error => reject(this._createErrorObject("activateAccount", 500, error,
          "Unable to activate account. Wrong or old link maybe?")));
    });
  }

  _updateAccountStatus(activationObj) {
    const query = {
      data: `
          mutation {
            updateUser(id: \\"` + activationObj.user.id + `\\", roles: AUTH) {
              id
            }
          }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return new Promise((resolve, reject) => {
      const id = activationObj.id;
      return this.gcClient.query(query)
        .then(response => {
          logger.debug("Account status updated to AUTH for user: " + id);
          return resolve(id);
        })
        .catch(error => reject(this._createErrorObject("_updateAccountStatus", 500, error,
          "Unable to update account status.")));
    });
  }

  _deleteActivationObject(id) {
    logger.debug("got here.");
    const query = {
      data: `
          mutation {
            deleteActivation(id: \\"` + id + `\\") {
              id
            }
          }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };


    return new Promise((resolve, reject) => {
      return this.gcClient.query(query)
        .then(response => {
          logger.debug("Activation object deleted.");
          return resolve(response);
        })
        .catch(error => reject(this._createErrorObject("_deleteActivationObject", 500, error,
          "Unable to delete activation object.")));
    });
  }

  _saveActivationCode(userId, code) {
    const time = new Date().getTime();
    const date = new Date(time);
    const dateISO = date.toISOString();

    const query = {
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

    return new Promise((resolve, reject) => {
      return this.gcClient.query(query)
        .then(response => {
          logger.debug("Activation code saved for user: " + userId + ".");
          return resolve(response);
        })
        .catch(error => reject(this._createErrorObject("_saveActivationCode", 500, error,
          "Unable to save activation code.")));
    });
  }

  _linkActivationToUser(userId, activationId) {
    const query = {
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

    return new Promise((resolve, reject) => {
      return this.gcClient.query(query)
        .then(response => {
          logger.debug("Activation code linked with user: " + userId + ".");
          return resolve(response);
        })
        .catch(error => reject(this._createErrorObject("_linkActivationToUser", 500, error,
          "Unable to link activation object with user object.")));
    });
  }

  _sendWelcomeMail(email, vars) {
    return new Promise((resolve, reject) => {
      fs.readFile(process.cwd() + "/" + ENV_VARS.ROOT + '/welcome-email.html', 'utf8', (error, html) => {
          if (error) {
            return reject(error);
          }

          const htmlFinal = this.mailClient.processHTMLString(html, vars);
          return this.mailClient.sendMail(email, "Welcome to sayHi.ai!", htmlFinal)
            .then(response => {
              logger.debug("Activation email sent to " + email + ".");
              return resolve(response);
            })
            .catch(error => reject(error));
        }
      );
    });
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

  _createErrorObject(method, code, error, message) {
    return {
      file: "activationHandler.js",
      method: method,
      code: code,
      error: error,
      message: message
    };
  }
}
