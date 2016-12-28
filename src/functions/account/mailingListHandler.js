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
      query: `
        query {
          User(email: "` + email + `") {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return this._gcClient.query(query)
      .then(response => this._createMailingListEntry(email, response.User))
      .catch(error => {
        throw this._errorHandler.create("addToMailingList", 400, error, "Unable to add account to" +
          "mailing list. Maybe wrong user credentials?");
      });
  }

  removeFromMailingList(email) {
    logger.info("Removing user: " + email + " from mailing list..");

    return this._getMailingListId(email)
      .then(response => {
        const query = {
          query: `
            mutation {
              deleteMailingList(id: "` + response.MailingList.id + `") {
                id
              }
            }`,
          token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
        };

        return this._gcClient.query(query);
      })
      .then(response => {
        logger.info("Removed user: " + email + " from mailing list.");
        return response;
      })
      .catch(error => {
        throw this._errorHandler.create("removeFromMailingList", 400, error, "Unable to remove account from mailing" +
          "list. Maybe wrong user credentials?");
      });
  }

  _getMailingListId(email) {
    const query = {
      query: `
        query {x
          MailingList(email: "` + email + `") {
            id
            }
         }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return this._gcClient.query(query)
      .catch(error => {
        throw this._errorHandler.create("_getMailingListId", 400, error, "Unable to get mailing list id.");
      });
  }

  _createMailingListEntry(email, user) {
    const query = {
      query: `
        mutation {
          createMailingList(email: "` + email + `") {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return this._gcClient.query(query)
      .then(response => {
        if (user === null) {
          logger.info("Added user: " + user + " to mailing list.");
          return response;
        }

        const mailingListId = response.createMailingList.id;
        return this._linkUserToMailingList(user.id, mailingListId)
          .catch(error => {
            throw error;
          });
      })
      .catch(error => {
        throw this._errorHandler.create("_createMailingListEntry", 400, error, "Unable to create mailing list entry.");
      });
  }

  _linkUserToMailingList(userID, mailingListID) {
    const query = {
      query: `
        mutation {
          setUserMailRelation(usersUserId: "` + userID + `", mailinglistMailingListId: "` + mailingListID + `") {
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

    return this._gcClient.query(query)
      .then(response => {
        logger.info("Added user: " + userID + " to mailing list.");
        return response;
      })
      .catch(error => {
        throw this._errorHandler.create("_linkUserToMailingList", 500, error, "Unable to link user to mailing list.");
      });
  }
}
