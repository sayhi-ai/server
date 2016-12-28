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
      query: `
        mutation {
          signinUser(
            email: { 
              email: "` + email + `",
              password: "` + password + `"
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

    return this._gcClient.login(query)
      .then(response => {
        if (response === null) {
          throw this._errorHandler.create("login", 401, "", "Username or password is incorrect.");
        }
        const token = response.signinUser.token;
        logger.debug("Login successful.");

        return token;
      })
      .then(token => this._functionHandler.getActivationHandler().isActivated(email)
        .then(activated => {
          return {
            token: token,
            activated: activated
          };
        }))
        .catch(error => {
          throw error;
        })
      .then(result => {
        if (!result.activated) {
          throw this._errorHandler.create("login", 401, "", "Account not activated.");
        }
        logger.debug("Account is activated.");
        return JSON.stringify({token: result.token});
      })
      .catch(error => {
        throw error;
      });
  }

  linkAccountAuth0(firstName, lastName, token) {
    logger.debug("Auth0 account link request received..");
    const query = {
      query: `
        mutation {
          createUser(
            authProvider: { 
              auth0: { 
                idToken: "` + token + `" 
              }
            },
            firstName: "` + firstName + `",
            lastName: "` + lastName + `",
          ) {
            id
          }
        }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return this._gcClient.query(query)
      .then(response => {
        logger.debug("Auth0 account link successful.");
        return response;
      })
      .catch(error => {
        throw this._errorHandler.create("linkAccountAuth0", 400, error, "Error linking accounts.");
      });
  }

  addUser(firstName, lastName, email, password) {
    logger.debug("Creating a new user account..");
    const time = new Date().getTime();
    const date = new Date(time);
    const dateISO = date.toISOString();

    const query = {
      query: `
          mutation {
            createUser(
              authProvider: {
                email: {
                  email: "` + email + `",
                  password: "` + password + `",
                }
              },
              firstName: "` + firstName + `",
              lastName: "` + lastName + `",
              joined: "` + dateISO + `",
            ) {
              id
            }
          }`,
      token: ENV_VARS.CONSTANTS.MASTER_GRAPHCOOL_TOKEN
    };

    return this._gcClient.query(query)
      .then(response => {
        if (response.createUser !== null) {
          logger.debug("User account created successfully.");
          this._functionHandler.getActivationHandler().sendActivationRequest(email,
            response.createUser.id, firstName);
          return JSON.stringify({created: true});
        } else if (response.errors[0].code === ENV_VARS.GC_ERRORS.USER_EXISTS) {
          logger.debug("Account not created - e-mail already taken.");
          return JSON.stringify({created: false, message: "User with that e-mail already exists."});
        }
      })
      .catch(error => {
        throw this._errorHandler.create("addUser", 400, error, "Error creating a new account.");
      });
  }
}
