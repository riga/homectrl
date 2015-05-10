// lib/routes.js

/**
 * Routes and handlers for the express app.
 */


// node modules
var fs     = require("fs");
var path   = require("path");
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
    pluginNames: null,
    useCdn     : server.config.get("client:useCdn"),
    wsPort     : server.config.get("websocket:publicPort"),
    logging    : server.config.get("client:logging")
  };

  // load locales
  var locales = {};
  server.config.get("client:availableLanguages").forEach(function(lang) {
    try {
      var data = fs.readFileSync(path.join("locales", lang + ".json"), { encoding: "utf8" });
      locales[lang] = JSON.parse(data);
    } catch (err) {
      server.logger.error("cannot load locales: %s", err.message);
    }
  });


  /**
   * Routes.
   */

  // GET /index
  GET("/", "/index", function(req, res) {
    // set hcData.pluginNames once
    if (!hcData.pluginNames) {
      hcData.pluginNames = Object.keys(server.plugins);
    }

    // prepare template data
    var _hcData = extend({ lang: req.lang }, hcData);
    var data = {
      sessionId    : req.session.id,
      locales      : locales[req.lang],
      localesString: JSON.stringify(locales[req.lang]),
      hcData       : _hcData,
      hcDataString : JSON.stringify(_hcData)
    };

    res.render("views/index.jade", data);
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
