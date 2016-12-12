import ENV_VARS from "../../ENV_VARS";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
    this.functionHandler = functionHandler;
  }

  login(email, password, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          signinUser(
            email: { 
              email: \\"` + email + `\\",
              password: \\"` + password + `\\"
            }
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
      let token = response.data.signinUser.token;
      successFunc(JSON.stringify({token: token}));
    }, error => {
      errorFunc(error);
    });
  }

  linkAccountAuth0(firstName, lastName, token, successFunc, errorFunc) {
    let query = {
      data: `
        mutation {
          createUser(
            authProvider: { 
              auth0: { 
                idToken: \\"` + token + `\\" 
              }
            },
            firstName: \\"` + firstName + `\\",
            lastName: \\"` + lastName + `\\",
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

  addUser(firstName, lastName, email, password, successFunc, errorFunc) {
    let query = {
      data: `
      mutation {
        createUser(
          authProvider: {
            email: {
              email: \\"` + email + `\\",
              password: \\"` + password + `\\",
            }
          },
          firstName: \\"` + firstName + `\\",
          lastName: \\"` + lastName + `\\",
        ) {
          id
        }
      }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    this.gcClient.query(query, response => {
      this.functionHandler.getActivationHandler().sendActivationRequest(email,
        response.data.createUser.id, firstName, successFunc, errorFunc);
      successFunc(response);
    }, error => {
      errorFunc(error);
    });
  }
}
