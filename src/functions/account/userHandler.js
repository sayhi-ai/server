import ENV_VARS from "../../util/ENV_VARS";
import logger from "../../util/logger";
import ErrorHandler from "../../util/errorHandler";

export default class {
  constructor(functionHandler, clientsHandler) {
    this._gcClient = clientsHandler.getGCClient();
    this._functionHandler = functionHandler;
    this._errorHandler = new ErrorHandler("userHandler.js");
  }

  login(email, password) {
    logger.debug("Login request received..");
    const query = {
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

    return new Promise((resolve, reject) => {
      return this._gcClient.login(query)
        .then(response => {
          logger.debug("Login successful.");

          const token = response.data.signinUser.token;
          return resolve(JSON.stringify({token: token}));
        })
        .catch(error => reject(this._errorHandler.create("login", 401, error, "Username or password is incorrect.")));
    });
  }

  linkAccountAuth0(firstName, lastName, token, successFunc, errorFunc) {
    logger.debug("Auth0 account link request received..");
    const query = {
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

    this._gcClient.query(query, response => {
      logger.debug("Auth0 account link successful.");
      successFunc(response);
    }, error => {
      const errorObj = {
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
    const time = new Date().getTime();
    const date = new Date(time);
    const dateISO = date.toISOString();

    const query = {
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

    return new Promise((resolve, reject) => {
      this._gcClient.query(query)
        .then(response => {
          if (response.data.createUser !== null) {
            logger.debug("User account created successfully.");
            this._functionHandler.getActivationHandler().sendActivationRequest(email,
              response.data.createUser.id, firstName);
            return resolve(JSON.stringify({created: true}));
          } else if (response.errors[0].code === ENV_VARS.GC_ERRORS.USER_EXISTS) {
            logger.debug("Account not created - e-mail already taken.");
            return resolve(JSON.stringify({created: false, message: "User with that e-mail already exists."}));
          }
        })
        .catch(error => reject(this._errorHandler.create("addUser", 400, error, "Error creating a new account.")));
    });
  }
}
