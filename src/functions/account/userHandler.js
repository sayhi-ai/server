import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";

export default class {
  constructor(functionHandler, clientsHandler) {
    this.gcClient = clientsHandler.getGCClient();
    this.functionHandler = functionHandler;
  }

  login(email, password, successFunc, errorFunc) {
    logger.debug("Login request received..");
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
      logger.debug("Login successful.");

      let token = response.data.signinUser.token;
      successFunc(JSON.stringify({token: token}));
    }, error => {
      let errorObj = {
        file: "userHandler.js",
        method: "login",
        code: 401,
        error: error,
        message: "Username or password is incorrect."
      };

      errorFunc(errorObj);
    });
  }

  linkAccountAuth0(firstName, lastName, token, successFunc, errorFunc) {
    logger.debug("Auth0 account link request received..");
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
      logger.debug("Auth0 account link successful.");
      successFunc(response);
    }, error => {
      let errorObj = {
        file: "userHandler.js",
        method: "linkAccountAuth0",
        code: 401,
        error: error,
        message: "Error linking accounts."
      };

      errorFunc(errorObj);
    });
  }

  addUser(firstName, lastName, email, password) {
    logger.debug("Creating a new user account..");
    let time = new Date().getTime();
    let date = new Date(time);
    let dateISO = date.toISOString();

    return new Promise((resolve, reject) => {
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
              joined: \\"` + dateISO + `\\",
            ) {
              id
            }
          }`,
        token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
      };

      this.gcClient.query(query, response => {
        if (response.data.createUser !== null) {
          logger.debug("User account created successfully.");
          this.functionHandler.getActivationHandler().sendActivationRequest(email, response.data.createUser.id,
            firstName);
          return resolve(JSON.stringify({created: true}));
        } else if (response.errors[0].code === ENV_VARS.GC_ERRORS.USER_EXISTS) {
          logger.debug("Account not created - e-mail already taken.");
          return resolve(JSON.stringify({created: false, message: "User with that e-mail already exists."}));
        }
      }, error => {
        let errorObj = {
          file: "userHandler.js",
          method: "addUser",
          code: 400,
          error: error,
          message: "Error creating a new account."
        };

        return reject(errorObj);
      });
    });
  }
}
