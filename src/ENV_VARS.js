let ENV_VARS;

const CONSTANTS = {
  GRAPHCOOL_URL: "https://api.graph.cool/simple/v1/citcyox3z0pbh0171u6i6b8nu",
  MASTER_GRAPHCOOL_TOKEN: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE" +
    "0NzQ5MDYzNjgsImNsaWVudElkIjoiY2l0Y3gwcXQ1MG8xdjAxNzF5dWgwdXZreCIsInByb" +
    "2plY3RJZCI6ImNpdGN5b3gzejBwYmgwMTcxdTZpNmI4bnUiLCJwZXJtYW5lbnRBdXRoVG9" +
    "rZW5JZCI6ImNpdGs5NjVtaDBhenkwMTc1bXdxM3dyaWkifQ.m_zwEYNOcvR1Afrgo476lb" +
    "fehmqwZ0YdvtPyACUkezo",
  INFO_MAIL_PASSWORD: "KkW{cQ^h,c82[(/]8)5u<4a,(&$?RUx:sBZ:Y_cM",
  SUPPORT_MAIL_PASSWORD: "Yf)A6)kr7!fTj([&]v:d[v`K6yZ,Lk.s@6tC=n'2"
};

if (process.env.NODE_ENV === "production") {
  ENV_VARS = {
    ROOT: "build",
    BASE_URL: "https://api.sayhi.ai",
    CONSTANTS: CONSTANTS
  };
} else {
  ENV_VARS = {
    ROOT: "dev",
    BASE_URL: "http://localhost:8080",
    CONSTANTS: CONSTANTS
  };
}

export default ENV_VARS;
