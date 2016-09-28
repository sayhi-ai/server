import MailingListHandler from "./account/mailingListHandler";
import UserHandler from "./account/userHandler";
import ActivationHandler from "./account/activationHandler";
import ResponseHandler from "./responses/responseHandler";

export default class {
  constructor(serviceHandler) {
    this.mailingListHandler = new MailingListHandler(this, serviceHandler);
    this.userHandler = new UserHandler(this, serviceHandler);
    this.activationHandler = new ActivationHandler(this, serviceHandler);
    this.responseHandler = new ResponseHandler(this, serviceHandler);
  }

  getMailingListHandler() {
    return this.mailingListHandler;
  }

  getUserHandler() {
    return this.userHandler;
  }

  getActivationHandler() {
    return this.activationHandler;
  }

  getResponseHandler() {
    return this.responseHandler;
  }
}
