import ENV_VARS from "../ENV_VARS";
import fs from "fs";

export default class {
  constructor(serviceHandler) {
    this.gcClient = serviceHandler.getGCClient();
    this.mailClient = serviceHandler.getMailClient();
  }

  sendWelcomeMail(email, successFunc, errorFunc) {
    fs.readFile(process.cwd() + ENV_VARS.ROOT +
      '/welcome-email.html', 'utf8', (error, html) => {
        if (error) {
          errorFunc(error);
        } else {
          this.mailClient.sendMail(email, "Welcome to sayHi.ai!",
            html, successFunc, errorFunc);
        }
      }
    );
  }
}
