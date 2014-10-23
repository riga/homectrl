// public.js

// simple mapping to create an object to import within plugins
module.exports = {
  HCPlugin: require("./plugin.js"),
  send    : require("./util.js").http.send,
  errors  : require("./util.js").http.errors
};