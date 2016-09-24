import fetch from "isomorphic-fetch";

const createQuery = query => {
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
};

export default (query, success, error) => {
  fetch("https://api.graph.cool/simple/v1/citcyox3z0pbh0171u6i6b8nu", {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: createQuery(query)
  })
  .then(response => {
    if (response.status === 200) {
      response.json().then(json => success(json));
    } else {
      response.json().then(json => error(json));
    }
  });
};
