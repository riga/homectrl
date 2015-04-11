// lib/routes.js

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
  var GET  = http.resolve(server.app, "get",  server.dynamicRoot);
  var POST = http.resolve(server.app, "post", server.dynamicRoot);


  /**
   * Routes.
   */

  // data passed to the index page
  var hcData = {
    dynamicRoot: server.dynamicRoot,
    staticRoot : server.staticRoot,
    plugins    : null,
    useCdn     : server.config.get("client:useCdn"),
    wsRoot     : server.wsRoot,
    wsPort     : server.config.get("websocket:port")
  };

  // GET /index
  GET("/", "/index", function(req, res) {
    // set hcData.plugins if necessary
    if (!hcData.plugins) {
      hcData.plugins = Object.keys(server.plugins);
    }

    res.render("views/index.jade", hcData);
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
