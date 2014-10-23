// public.js
// this file is linked as node_modules/homectrl/index.js in bin/run

// simple mapping to create an object to import within plugins
module.exports = {
  Plugin: require("./plugin.js"),
  send  : require("./util.js").http.send,
  errors: require("./util.js").http.errors
};
