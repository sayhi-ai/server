import ENV_VARS from "../ENV_VARS";

export default class {
  constructor(gcClient) {
    this.gcClient = gcClient;
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
          setUMRelation(
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
