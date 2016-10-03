import nodemailer from 'nodemailer';
import ENV_VARS from "../ENV_VARS";

export default class {
  constructor() {
    let smtpConfig = {
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: 'info@sayhi.ai',
        pass: ENV_VARS.CONSTANTS.INFO_MAIL_PASSWORD
      }
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
  }

  sendMail(recipient, subject, content, successFunc, errorFunc) {
    var mailOptions = {
      from: '"sayHi.ai" <info@sayhi.ai>',
      to: recipient,
      subject: subject,
      html: content
    };

    this.transporter.sendMail(mailOptions, function(error, response) {
      if (error) {
        errorFunc(error);
      } else {
        successFunc(response);
      }
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
