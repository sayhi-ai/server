import SHA3 from 'sha3';
import crypto from 'crypto';
import fs from 'fs';
import ENV_VARS from "../../ENV_VARS";

export default class {
  constructor(functionHandler, serviceHandler) {
    this.gcClient = serviceHandler.getGCClient();
    this.mailClient = serviceHandler.getMailClient();
  }

  sendActivationRequest(email, firstName, successFunc, errorFunc) {
    let activationCode = this._generateActivationCode(email);
    let activationLink = ENV_VARS.BASE_URL + '/activate?code=' + activationCode;
    let vars = [firstName, activationLink];
    this._sendWelcomeMail(email, vars,
      () => this._saveActivationCode(email, activationCode,
        successFunc, errorFunc)
      , errorFunc);
  }

  _saveActivationCode(email, code, successFunc, errorFunc) {
    var dateObj = new Date();
    var dateMilli = dateObj.getTime();

    let query = {
      data: `
        mutation {
          createActivation(
            email: \\"` + email + `\\"
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

  _generateActivationCode(email) {
    let hash = new SHA3.SHA3Hash();
    let salt = crypto.randomBytes(16);
    hash.update(email + salt);
    return hash.digest('hex').substring(0, 50);
  }
}
