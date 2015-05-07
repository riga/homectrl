// lib/routes.js

/**
 * Routes and handlers for the express app.
 */


// node modules
var extend = require("util")._extend;

// local modules
var http = require("./http");


/**
 * Export.
 *
 * @param server - The server instance.
 */
module.exports = function(server) {
  // use http.resolve to create GET and POST helpers
  var GET  = http.resolve(server.app, "get",  server.dynamicRoot);
  var POST = http.resolve(server.app, "post", server.dynamicRoot);

  // data passed to the index page
  var hcData = {
    dynamicRoot: server.dynamicRoot,
    staticRoot : server.staticRoot,
    plugins    : null,
    useCdn     : server.config.get("client:useCdn"),
    wsPort     : server.config.get("websocket:publicPort"),
    logging    : server.config.get("client:logging")
  };


  /**
   * Routes.
   */

  // GET /index
  GET("/", "/index", function(req, res) {
    // set hcData.plugins if necessary
    if (!hcData.plugins) {
      hcData.plugins = Object.keys(server.plugins);
    }

    res.render("views/index.jade", extend({ sessionId: req.session.id }, hcData));
  });

  // POST /logout
  POST("/logout", function(req, res) {
    // disconnect the attached socket
    var socket = server.sockets[req.cookies.socketId];
    if (socket) {
      socket.disconnect();
    }

    // destroy the session
    req.session.destroy(function() {
      res.set("WWW-Authenticate", "Basic realm='homectrl'");
      res.status(401);
      http.send(res, 401);
    });
  });

  // POST /shutdown
  POST("/shutdown", function(req, res) {
    http.send(res);
    server.stop();
  });
};
