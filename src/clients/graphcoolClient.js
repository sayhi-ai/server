import fetch from "isomorphic-fetch";
import ENV_VARS from "../util/ENV_VARS";
import logger from "../util/logger";

export default class {
  login(query, success, error) {
    this._safeQuery(ENV_VARS.CONSTANTS.GRAPHCOOL_URL,
      "POST", {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }, () => this._createQuery(query),
      success,
      error);
  }

  query(query, success, error) {
    this._safeQuery(ENV_VARS.CONSTANTS.GRAPHCOOL_URL,
    "POST", {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + query.token
    }, () => this._createQuery(query),
    success,
    error);
  }

  _safeQuery(url, method, headers, bodyFunc, successFunc, errorFunc) {
    try {
      fetch(url, {
        method: method,
        headers: headers,
        body: (() => {
          try {
            return bodyFunc();
          } catch (e) {
            logger.error("Error executing body function.");
            let error = {
              file: "graphcoolClient.js",
              method: "_safeQuery",
              code: 500,
              error: e.message,
              message: "Error with graph QL query."
            };

            errorFunc(error);
          }
        })()
      })
      .then(response => {
        try {
          if (response.status === 200) {
            response.json().then(json => {
              try {
                successFunc(json);
              } catch (e) {
                logger.error("Error executing success function.");
                let error = {
                  file: "graphcoolClient.js",
                  method: "_safeQuery",
                  code: 500,
                  error: e.message,
                  message: "Error with graph QL query."
                };

                errorFunc(error);
              }
            });
          } else {
            response.json().then(json => {
              try {
                let error = {
                  file: "graphcoolClient.js",
                  method: "_safeQuery",
                  code: 500,
                  error: json,
                  message: "Error with graph QL query."
                };

                errorFunc(error);
              } catch (e) {
                logger.error("Error executing error function.");
                let error = {
                  file: "graphcoolClient.js",
                  method: "_safeQuery",
                  code: 500,
                  error: e.message,
                  message: "Error with graph QL query."
                };

                errorFunc(error);
              }
            });
          }
        } catch (e) {
          logger.error("Error executing response from server.");
          let error = {
            file: "graphcoolClient.js",
            method: "_safeQuery",
            code: 500,
            error: e.message,
            message: "Error with graph QL query."
          };

          errorFunc(error);
        }
      });
    } catch (e) {
      logger.error("Error making request to server.");
      let error = {
        file: "graphcoolClient.js",
        method: "_safeQuery",
        code: 500,
        error: e.message,
        message: "Error with graph QL query."
      };

      errorFunc(error);
    }
  }

  _createQuery(query) {
    let dataFull;
    let varsFull;
    let opNameFull;

    if (query.data === undefined) {
      dataFull = '"query":""';
    } else {
      dataFull = '"query":"' + query.data + '"';
    }

    if (query.vars === undefined) {
      varsFull = '"variables":""';
    } else {
      varsFull = '"variables":"' + query.vars + '"';
    }

    if (query.opName === undefined) {
      opNameFull = '"operationName":null';
    } else {
      opNameFull = '"operationName":"' + query.opName + '"';
    }

    let queryFinal = '{' + dataFull + ',' + varsFull + ',' + opNameFull + '}';
    return queryFinal.replace(/(\r\n|\n|\r)/gm, '');
  }
}
