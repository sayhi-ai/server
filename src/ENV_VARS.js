let ENV_VARS;

if (process.env.NODE_ENV === "production") {
  ENV_VARS = {
    GRAPHCOOL_URL: "https://api.graph.cool/simple/v1/citcyox3z0pbh0171u6i6b8nu"
  };
} else {
  ENV_VARS = {
    GRAPHCOOL_URL: "https://api.graph.cool/simple/v1/citcyox3z0pbh0171u6i6b8nu"
  };
}

export default ENV_VARS;
