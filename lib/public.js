// public.js
// this file is linked as node_modules/homectrl/index.js in index.js

// simple mapping to create an object that is imported within plugins
// when calling require("homectrl")
module.exports = {
  Plugin: require("./plugin.js"),
  send  : require("./util.js").http.send,
  errors: require("./util.js").http.errors
};
