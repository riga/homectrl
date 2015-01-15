// routes.js

// node modules
var util = require("util"),
    exec = require("child_process").exec;

// local modules
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
    res.render("views/index.jade", {
      root   : root,
      user   : req.session.user,
      plugins: Object.keys(server.plugins),
      useCdn : server.config.get("client:useCdn"),
      ioPort : server.config.get("io:port")
    });
  });

  POST("/logout", function(req, res) {
    res.status(401);
    res.set("WWW-Authenticate", 'Basic realm="homectrl"');
    res.end();
  });

  POST("/shutdown", function(req, res) {
    http.send(res);
    process.exit();
  });
};


module.exports = routes;
