import fs from 'fs';
import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";
import ErrorHandler from "../../util/errorHandler";
import Promise from "bluebird";

export default class {
  constructor(functionHandler, clientsHandler) {
    this._gcClient = clientsHandler.getGCClient();
    this._mailClient = clientsHandler.getMailClient();
    this._errorHandler = new ErrorHandler("activationHandler.js");
  }

  sendActivationRequest(email, userId, firstName) {
    logger.debug("Sending activation request to " + email + "..");

    const activationCode = this.generateRandomCode(60);
    const activationLink = ENV_VARS.BASE_URL + '/account/activate?code=' + activationCode;
    const vars = [firstName, activationLink];

    return this._sendWelcomeMail(email, vars)
      .then(response => this.saveActivationCode(userId, activationCode))
      .catch(error => logger.error(this._errorHandler.create("sendActivationRequest", 500, error,
        "Unable to create activatio request for user:  " + email)));
  }

  activateAccount(code) {
    logger.debug("Request to activate account received.");

    const query = {
      query: `
        query {
          Activation(code: "` + code + `") {
            id,
            user {
              id
            }
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return this._gcClient.query(query)
      .then(response => this._updateAccountStatus(response.Activation))
      .then(id => this.deleteActivationObject(id))
      .catch(error => {
        throw this._errorHandler.create("activateAccount", 500, error, "Unable to activate account. Wrong or old" +
          " link maybe?");
      });
  }

  isActivated(email) {
    logger.debug("Checking if user account: " + email + " is activated.");

    const query = {
      query: `
        query {
          User(email: "` + email + `") {
            roles
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return this._gcClient.query(query)
      .then(response => response.User.roles === "AUTH")
      .catch(error => {
        throw this._errorHandler.create("isActivated", 500, error, "Unable to check if account: " + email + " is actived");
      });
  }

  updateActivationCode(id, code) {
    const query = {
      query: `
        mutation {
          updateActivation(id: "` + id + `", code: "` + code + `") {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return this._gcClient.query(query)
      .then(response => {
        logger.debug("Updated activation code for: " + id + ".");
        return response;
      })
      .catch(error => {
        throw this._errorHandler.create("isActivated", 500, error, "Unable to update activation code for: " + id + ".");
      });
  }

  _updateAccountStatus(activationObj) {
    const query = {
      query: `
          mutation {
            updateUser(id: "` + activationObj.user.id + `", roles: AUTH) {
              id
            }
          }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    const id = activationObj.id;
    return this._gcClient.query(query)
      .then(response => {
        logger.debug("Account status updated to AUTH for user: " + id);
        return id;
      })
      .catch(error => {
        throw this._errorHandler.create("_updateAccountStatus", 500, error, "Unable to update account status.");
      });
  }

  deleteActivationObject(id) {
    logger.debug("got here.");
    const query = {
      query: `
        mutation {
          deleteActivation(id: "` + id + `") {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return this._gcClient.query(query)
      .then(response => {
        logger.debug("Activation object deleted.");
        return response;
      })
      .catch(error => {
        throw this._errorHandler.create("deleteActivationObject", 500, error, "Unable to delete activation object.");
      });
  }

  saveActivationCode(userId, code) {
    const time = new Date().getTime();
    const date = new Date(time);
    const dateISO = date.toISOString();

    const query = {
      query: `
        mutation {
          createActivation(code: "` + code + `" date: "` + dateISO + `") {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return this._gcClient.query(query)
      .then(response => {
        logger.debug("Activation code saved for user: " + userId + ".");
        return response;
      })
      .then(response => this._linkActivationToUser(userId, response.createActivation.id))
      .catch(error => {
        throw this._errorHandler.create("saveActivationCode", 500, error, "Unable to save activation code.");
      });
  }

  _linkActivationToUser(userId, activationId) {
    const query = {
      query: `
        mutation {
          setUserActivationRelation(userUserId: "` + userId + `" activationActivationId: "` + activationId + `") {
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

    return this._gcClient.query(query)
      .then(response => {
        logger.debug("Activation code linked with user: " + userId + ".");
        return response;
      })
      .catch(error => {
        throw this._errorHandler.create("_linkActivationToUser", 500, error, "Unable to link activation object with" +
          "user object.");
      });
  }

  _sendWelcomeMail(email, vars) {
    return new Promise((resolve, reject) => {
      fs.readFile(process.cwd() + "/" + ENV_VARS.ROOT + '/welcome-email.html', 'utf8', (error, html) => {
        if (error) {
          return reject(error);
        }

        const htmlFinal = this._mailClient.processHTMLString(html, vars);
        return this._mailClient.sendMail(email, "Welcome to sayHi.ai!", htmlFinal)
          .then(response => {
            logger.debug("Activation email sent to " + email + ".");
            return resolve(response);
          })
          .catch(error => reject(error));
      });
    });
  }

  generateRandomCode(length) {
    let code = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++) {
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return code;
  }
}
