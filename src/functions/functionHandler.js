import MailingListHandler from "./account/mailingListHandler";
import UserHandler from "./account/userHandler";
import ActivationHandler from "./account/activationHandler";
import ResponseHandler from "./responses/responseHandler";

export default class {
  constructor(clientsHandler) {
    this.mailingListHandler = new MailingListHandler(this, clientsHandler);
    this.userHandler = new UserHandler(this, clientsHandler);
    this.activationHandler = new ActivationHandler(this, clientsHandler);
    this.responseHandler = new ResponseHandler(this, clientsHandler);
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
