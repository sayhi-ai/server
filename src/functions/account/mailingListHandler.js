import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";
import ErrorHandler from "../../util/errorHandler";

export default class {
  constructor(functionHandler, clientsHandler) {
    this._gcClient = clientsHandler.getGCClient();
    this._errorHandler = new ErrorHandler("mailingListHandler.js");
  }

  addToMailingList(email) {
    logger.debug("Adding user: " + email + " to mailing list..");
    const query = {
      data: `
        query {
          User(email: \\"` + email + `\\") {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return new Promise((resolve, reject) => {
      return this._gcClient.query(query)
        .then(response => this._createMailingListEntry(email, response.data.User))
        .then(response => resolve(response))
        .catch(error => reject(this._errorHandler.create("addToMailingList", 400, error, "Unable to add account to" +
          "mailing list. Maybe wrong user credentials?")));
    });
  }

  removeFromMailingList(email) {
    logger.info("Removing user: " + email + " from mailing list..");

    return new Promise((resolve, reject) => {
      this._getMailingListId(email)
        .then(response => {
          const query = {
            data: `
              mutation {
                deleteMailingList(id: \\"` + response.data.MailingList.id + `\\") {
                  id
                }
              }`,
            token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
          };

          return this._gcClient.query(query)
        })
        .then(response => {
          logger.info("Removed user: " + email + " from mailing list.");
          return resolve(response);
        })
        .catch(error => reject(this._errorHandler.create("removeFromMailingList", 400, error, "Unable to remove" +
          "account from mailing list. Maybe wrong user credentials?")));
    });
  }

  _getMailingListId(email) {
    const query = {
      data: `
        query {
          MailingList(email: \\"` + email + `\\") {
            id
            }
         }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return new Promise((resolve, reject) => {
      return this._gcClient.query(query)
        .then(response => resolve(response))
        .catch(error => reject(this._errorHandler.create("_getMailingListId", 400, error, "Unable to get mailing list" +
          "id.")));
      });
  }

  _createMailingListEntry(email, user) {
    const query = {
      data: `
        mutation {
          createMailingList(email: \\"` + email + `\\") {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return new Promise((resolve, reject) => {
      return this._gcClient.query(query)
        .then(response => {
          if (user === null) {
            logger.info("Added user: " + user + " to mailing list.");
            return resolve(response);
          } else {
            const mailingListId = response.data.createMailingList.id;
            return this._linkUserToMailingList(user.id, mailingListId)
              .then(response => resolve(response))
              .catch(error => reject(error));
          }
        })
        .catch(error => reject(this._errorHandler.create("_createMailingListEntry", 400, error, "Unable to create " +
          "mailing list entry.")));
    });
  }

  _linkUserToMailingList(userID, mailingListID) {
    const query = {
      data: `
        mutation {
          setUserMailRelation(
            usersUserId: \\"` + userID + `\\", 
            mailinglistMailingListId: \\"` + mailingListID + `\\") {
            usersUser {
              id
            }
            mailinglistMailingList {
              id
            }
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return new Promise((resolve, reject) => {
      return this._gcClient.query(query)
        .then(response => {
          logger.info("Added user: " + userID + " to mailing list.");
          return resolve(response);
        })
        .catch(error => reject(this._errorHandler.create("_linkUserToMailingList", 500, error, "Unable to link user " +
          "to mailing list.")));
    });
  }
}
