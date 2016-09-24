export function createQuery(data, vars, opName) {
  let dataFull = data;
  let varsFull = vars;
  let opNameFull = opName;

  if (data === undefined) {
    dataFull = '"query":""';
  } else {
    dataFull = '"query":"' + data + '"';
  }

  if (vars === undefined) {
    varsFull = '"variables":""';
  } else {
    varsFull = '"variables":"' + vars + '"';
  }

  if (opName === undefined) {
    opNameFull = '"operationName":null';
  } else {
    opNameFull = '"operationName":"' + opName + '"';
  }

  return '{' + dataFull + ',' + varsFull + ',' + opNameFull + '}';
}
