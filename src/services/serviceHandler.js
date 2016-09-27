import GCClient from "./graphcoolClient";
import MailClient from "./mailClient";

export default class {
  constructor() {
    this.gcClient = new GCClient();
    this.mailClient = new MailClient();
  }

  getGCClient() {
    return this.gcClient;
  }

  getMailClient() {
    return this.mailClient;
  }
}
