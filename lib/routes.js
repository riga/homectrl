// routes.js

/**
 * Routes and handlers for the express app.
 */


// node modules
var util = require("util");

// local modules
var http = require("./http");


/**
 * Export.
 *
 * @param server - The server instance.
 */
module.exports = function(server) {
  server.logger.info("Setup routes");

  // use http.resolve to create GET and POST helpers
  var root = server.config.get("app:root");
  var GET  = http.resolve(server.app, "get",  root);
  var POST = http.resolve(server.app, "post", root);

  /**
   * Routes.
   */

  // GET /index
  GET("/", "/index", function(req, res) {
    res.render("views/index.jade", {
      root   : root,
      user   : req.session.user,
      plugins: Object.keys(server.plugins),
      useCdn : server.config.get("client:useCdn"),
      wsPort : server.config.get("websocket:port")
    });
  });

  // POST /logout
  POST("/logout", function(req, res) {
    res.set("WWW-Authenticate", 'Basic realm="homectrl"');
    http.send(res, 401);
  });

  // POST /shutdown
  POST("/shutdown", function(req, res) {
    http.send(res);
    process.exit();
  });
};
