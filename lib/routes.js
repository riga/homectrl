// routes.js

// load node modules
var util = require("util");

// load local modules
var Emitter = require("./util.js").Emitter,
    http    = require("./util.js").http;


var routes = function(server) {
  server.logger.info("Setup routes");

  // use http.resolve to create GET and POST helpers
  var root = server.config.get("app:root");
  var GET  = http.resolve(server.app, root, "get");
  var POST = http.resolve(server.app, root, "post");


  // routes
  GET("/", "/index", function(req, res) {
    res.render("views/index.jade", { user: req.session.user });
  });
};


module.exports = routes;
