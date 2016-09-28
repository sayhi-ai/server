import fetch from "isomorphic-fetch";
import ENV_VARS from "../ENV_VARS";

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
            errorFunc(e);
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
                errorFunc(e);
              }
            });
          } else {
            response.json().then(json => {
              try {
                errorFunc(json);
              } catch (e) {
                errorFunc(e);
              }
            });
          }
        } catch (e) {
          errorFunc(e);
        }
      });
    } catch (e) {
      errorFunc(e);
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