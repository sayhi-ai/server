let ENV_VARS

// Checks if docker replaced url correctly, otherwise jump back to dev
const isProdUrl = url => {
  return !url.startsWith('$')
}

const CONSTANTS = {
  GRAPHCOOL_URL: "https://api.graph.cool/simple/v1/citcyox3z0pbh0171u6i6b8nu",
  MASTER_GRAPHCOOL_TOKEN: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE" +
    "0NzQ5MDYzNjgsImNsaWVudElkIjoiY2l0Y3gwcXQ1MG8xdjAxNzF5dWgwdXZreCIsInByb" +
    "2plY3RJZCI6ImNpdGN5b3gzejBwYmgwMTcxdTZpNmI4bnUiLCJwZXJtYW5lbnRBdXRoVG9" +
    "rZW5JZCI6ImNpdGs5NjVtaDBhenkwMTc1bXdxM3dyaWkifQ.m_zwEYNOcvR1Afrgo476lb" +
    "fehmqwZ0YdvtPyACUkezo",
  INFO_MAIL_PASSWORD: "KkW{cQ^h,c82[(/]8)5u<4a,(&$?RUx:sBZ:Y_cM",
  SUPPORT_MAIL_PASSWORD: "Yf)A6)kr7!fTj([&]v:d[v`K6yZ,Lk.s@6tC=n'2",
  MAX_PHRASE_TOKEN_LENGTH: 50,
  MAX_RESPONSE_LENGTH: 300,
  RESPONSE_VARIABLE: "$VAR",
  BASE_LOG_DIR: "./log",
  HTTP_LOG_DIR: "./log/http",
  SERVER_LOG_DIR: "./log/server",
  SERVER_LOG_FILE: "./log/server/server.log"
}

const GC_ERRORS = {
  USER_EXISTS: 3023
}

const SERVER_URL_PROD = "${SERVER_URL}"
const DASHBOARD_URL_PROD = "${DASHBOARD_URL}"
const PAGE_URL_PROD = "${PAGE_URL}"

if (process.env.NODE_ENV === "production" && isProdUrl(SERVER_URL_PROD)) {
  ENV_VARS = {
    ROOT: "build",
    BASE_URL: SERVER_URL_PROD,
    CLIENT_URL: DASHBOARD_URL_PROD,
    LANDING_PAGE_URL: PAGE_URL_PROD,
    CONSTANTS: CONSTANTS,
    GC_ERRORS: GC_ERRORS
  }
} else {
  ENV_VARS = {
    ROOT: "dev",
    BASE_URL: "http://localhost:8080",
    CLIENT_URL: "http://localhost:4000",
    LANDING_PAGE_URL: "http://localhost:4001",
    CONSTANTS: CONSTANTS,
    GC_ERRORS: GC_ERRORS
  }
}

export default ENV_VARS
