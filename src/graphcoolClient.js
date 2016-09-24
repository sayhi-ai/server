import fetch from "isomorphic-fetch";
import ENV_VARS from "./ENV_VARS";

export default class {
  fetch(query, success, error) {
    fetch(ENV_VARS.GRAPHCOOL_URL, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: this._createQuery(query)
    })
    .then(response => {
      if (response.status === 200) {
        response.json().then(json => success(json));
      } else {
        response.json().then(json => error(json));
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

    return '{' + dataFull + ',' + varsFull + ',' + opNameFull + '}';
  }
}
