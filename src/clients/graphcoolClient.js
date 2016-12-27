import fetch from "isomorphic-fetch";
import ENV_VARS from "../util/ENV_VARS";
import logger from "../util/logger";
import _errorHandler from "../util/errorHandler";
import Promise from "bluebird";

export default class {
  constructor() {
    this._errorHandler = new _errorHandler("graphcoolClient.js");
  }

  login(query) {
    return this._safeQuery(ENV_VARS.CONSTANTS.GRAPHCOOL_URL,
      "POST", {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }, () => this._createQuery(query));
  }

  query(query) {
    return this._safeQuery(ENV_VARS.CONSTANTS.GRAPHCOOL_URL,
      "POST", {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + query.token
      }, () => this._createQuery(query));
  }

  _safeQuery(url, method, headers, bodyFunc) {
    return new Promise((resolve, reject) => {
      try {
        fetch(url, {
          method: method,
          headers: headers,
          body: (() => {
            try {
              return bodyFunc();
            } catch (e) {
              logger.error("Error executing body function.");
              return reject(this._errorHandler.create("_safeQuery", 500, e.message, "Error with graph QL query."));
            }
          })()
        })
          .then(response => {
            try {
              if (response.status === 200) {
                response.json().then(json => {
                  try {
                    return resolve(json);
                  } catch (e) {
                    logger.error("Error executing success function.");
                    return reject(this._errorHandler.create("_safeQuery", 500, e.message, "Error with graph QL query."));
                  }
                });
              } else {
                response.json().then(json => {
                  try {
                    logger.error("No 200 response received from GQ server.");
                    return reject(this._errorHandler.create("_safeQuery", 500, json, "Error with graph QL query."));
                  } catch (e) {
                    logger.error("Error executing error function.");
                    return reject(this._errorHandler.create("_safeQuery", 500, e.message, "Error with graph QL query."));
                  }
                });
              }
            } catch (e) {
              logger.error("Error executing response from server.");
              return reject(this._errorHandler.create("_safeQuery", 500, e.message, "Error with graph QL query."));
            }
          });
      } catch (e) {
        logger.error("Error making request to server.");
        return reject(this._errorHandler.create("_safeQuery", 500, e.message, "Error with graph QL query."));
      }
    });
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
