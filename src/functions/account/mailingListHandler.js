import ENV_VARS from "../../util/ENV_VARS";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
  }

  addToMailingList(email, successFunc, errorFunc) {
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
      errorFunc(error);
    });
  }

  removeFromMailingList(email, successFunc, errorFunc) {
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
        successFunc(response);
      }, error => {
        errorFunc(error);
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
      errorFunc(error);
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
        successFunc(response);
      } else {
        let mailingListId = response.data.createMailingList.id;
        this._connectUserMailingList(user.id, mailingListId,
          successFunc, errorFunc);
      }
    }, error => {
      errorFunc(error);
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
      successFunc(response);
    }, error => {
      errorFunc(error);
    });
  }
}
