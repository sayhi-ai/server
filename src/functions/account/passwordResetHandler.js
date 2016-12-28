import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";
import ErrorHandler from "../../util/errorHandler";
import fs from 'fs';
import Promise from "bluebird";

export default class {
  constructor(functionHandler, clientsHandler) {
    this._functionHandler = functionHandler;
    this._gcClient = clientsHandler.getGCClient();
    this._mailClient = clientsHandler.getMailClient();
    this._errorHandler = new ErrorHandler("passwordResetHandler.js");
  }

  sendResetCode(email, deviceDesc) {
    logger.debug("Checking if user account: " + email + " is activated.");

    const query = {
      query: `
        query {
          User(email: "` + email + `") {
            id,
            firstName,
            roles,
            activation {
              id
            }
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return this._gcClient.query(query)
      .then(response => {
        if (response.User.roles !== "AUTH") {
          throw this._errorHandler.create("sendResetCode", 400, "", "Cannot reset password for a non-activated account.");
        }
        logger.debug("User account is activated.");
        return response;
      })
      .then(response => {
        const code = this._functionHandler.getActivationHandler().generateRandomCode(6);
        if (response.User.activation === null) {
          logger.debug("No activation object exists for user: " + email + ". Creating a new one..");
          return this._functionHandler.getActivationHandler().saveActivationCode(response.User.id, code)
            .then(response2 => {
              return {
                name: response.User.firstName,
                code: code
              };
            })
            .catch(error => {
              throw this._errorHandler.create("sendResetCode", 400, error, "Error creating a new password reset code.");
            });
        }

        logger.debug("Activation object exists for user: " + email + ". Updating it..");
        return this._functionHandler.getActivationHandler().updateActivationCode(response.User.activation.id, code)
          .then(response2 => {
            return {
              name: response.User.firstName,
              code: code,
              device: deviceDesc
            };
          }).catch(error => {
            throw this._errorHandler.create("sendResetCode", 400, error, "Error updating an existing password reset code.");
          });
      })
      .then(data => this._sendEmail(email, data))
      .catch(error => {
        throw error;
      });
  }

  _sendEmail(email, data) {
    logger.debug("Sending reset password email to: " + email + "..");

    return new Promise((resolve, reject) => {
      fs.readFile(process.cwd() + "/" + ENV_VARS.ROOT + '/password-reset.html', 'utf8', (error, html) => {
        if (error) {
          return reject(error);
        }

        const vars = [data.name, data.code, data.device];
        const htmlFinal = this._mailClient.processHTMLString(html, vars);
        return this._mailClient.sendMail(email, "Password reset code.", htmlFinal)
          .then(response => {
            logger.debug("Password reset email sent to " + email + ".");
            return resolve(response);
          })
          .catch(error => reject(error));
      });
    });
  }
}
