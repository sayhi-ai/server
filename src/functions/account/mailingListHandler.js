import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
  }

  addToMailingList(email, successFunc, errorFunc) {
    logger.debug("Adding user: " + email + " to mailing list..");
    let query = {
      data: `
        query {
          User(email: \\"` + email + `\\") {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      let user = response.data.User;
      this._createMailingListEntry(email, user, successFunc, errorFunc);
    }, error => {
      let errorObj = {
        file: "mailingListHandler.js",
        method: "addToMailingList",
        code: 400,
        error: error,
        message: "Unable to add account to mailing list. Maybe wrong user " +
          "credentials?"
      };

      errorFunc(errorObj);
    });
  }

  removeFromMailingList(email, successFunc, errorFunc) {
    logger.info("Removing user: " + email + " from mailing list..");
    this._getMailingListId(email, response => {
      let query = {
        data: `
          mutation {
            deleteMailingList(id: \\"` + response.data.MailingList.id + `\\") {
              id
            }
          }`,
        token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
      };

      this.gcClient.query(query, response => {
        logger.info("Removed user: " + email + " from mailing list.");
        successFunc(response);
      }, error => {
        let errorObj = {
          file: "mailingListHandler.js",
          method: "removeFromMailingList",
          code: 400,
          error: error,
          message: "Unable to remove account from mailing list. Maybe wrong" +
            "user credentials?"
        };

        errorFunc(errorObj);
      });
    }, errorFunc);
  }

  _getMailingListId(email, successFunc, errorFunc) {
    let query = {
      data: `
        query {
          MailingList(email: \\"` + email + `\\") {
            id
            }
         }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      successFunc(response);
    }, error => {
      let errorObj = {
        file: "mailingListHandler.js",
        method: "_getMailingListId",
        code: 500,
        error: error,
        message: "Unable to get mailing list id."
      };

      errorFunc(errorObj);
    });
  }

  _createMailingListEntry(email, user, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          createMailingList(email: \\"` + email + `\\") {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      if (user === null) {
        logger.info("Added user: " + user + " to mailing list.");
        successFunc(response);
      } else {
        let mailingListId = response.data.createMailingList.id;
        this._connectUserMailingList(user.id, mailingListId,
          successFunc, errorFunc);
      }
    }, error => {
      let errorObj = {
        file: "mailingListHandler.js",
        method: "_createMailingListEntry",
        code: 500,
        error: error,
        message: "Unable to create mailing list entry."
      };

      errorFunc(errorObj);
    });
  }

  _connectUserMailingList(userID, mailingListID, successFunc, errorFunc) {
    let query = {
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

    this.gcClient.query(query, response => {
      logger.info("Added user: " + userID + " to mailing list.");
      successFunc(response);
    }, error => {
      let errorObj = {
        file: "mailingListHandler.js",
        method: "_connectUserMailingList",
        code: 500,
        error: error,
        message: "Unable to link user to mailing list."
      };

      errorFunc(errorObj);
    });
  }
}
