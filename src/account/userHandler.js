import ENV_VARS from "../ENV_VARS";

export default class {
  constructor(gcClient) {
    this.gcClient = gcClient;
  }

  login(email, password, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          signinUser(
            email: \\"` + email + `\\",
            password: \\"` + password + `\\"
          ) {
            user {
              firstName, 
              email
            }, 
            token 
          }
        }`
    };

    this.gcClient.login(query, response => {
      successFunc(response);
    }, error => {
      errorFunc(error);
    });
  }

  addUser(firstName, lastName, email, password, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          createUser(
            firstName: \\"` + firstName + `\\",
            lastName: \\"` + lastName + `\\",
            email: \\"` + email + `\\",
            password: \\"` + password + `\\"
          ) {
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

  addToMailingList(email, successFunc, errorFunc) {
    let query = `query {
      User(email: \\"` + email + `\\") {
        id
      }
    }`;

    this.gcClient.query(query, response => {
      successFunc(response);
    }, error => {
      errorFunc(error);
    });
  }
}
