import nodemailer from 'nodemailer';
import ENV_VARS from "../util/ENV_VARS";
import logger from "../util/logger";
import ErrorHandler from "../util/errorHandler";
import Promise from "bluebird";

export default class {
  constructor() {
    const smtpConfig = {
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: 'info@sayhi.ai',
        pass: ENV_VARS.CONSTANTS.INFO_MAIL_PASSWORD
      }
    };

    this._transporter = nodemailer.createTransport(smtpConfig);
    this._errorHandler = new ErrorHandler("mailClient.js");
  }

  sendMail(recipient, subject, content) {
    logger.debug("Sending mail to: " + recipient + " on subject: " + subject + "..");
    const mailOptions = {
      from: '"sayHi.ai" <info@sayhi.ai>',
      to: recipient,
      subject: subject,
      html: content
    };

    return new Promise((resolve, reject) => {
      const context = this;
      this._transporter.sendMail(mailOptions, function(error, response) {
        if (error) {
          return reject(context._errorHandler.create("sendMail", 500, error, "Error with nodemailer."));
        }

        logger.debug("Mail sent to: " + recipient + " on subject: " + subject + ".");
        return resolve(response);
      });
    });
  }

  processHTMLString(html, vars) {
    let finalHtml = html;
    for (let i = 0; i < vars.length; i++) {
      finalHtml = finalHtml.replace("$VAR" + i + "$", vars[i]);
    }

    return finalHtml;
  }
}
