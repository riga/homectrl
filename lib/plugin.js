// plugin.js

/**
 * Plugin base class for all homectrl plugins.
 */


// node modules
var fs     = require("fs");
var path   = require("path");
var extend = require("util")._extend;

// npm modules
var express = require("express");
var nconf   = require("nconf");

// local modules
var Emitter = require("./emitter");
var http    = require("./http");
var util    = require("./util");


/**
 * Plugin definition.
 */
var Plugin = Emitter._extend({

  /**
   * Constructor. Called during server setup.
   *
   * @param server - The server instance.
   * @param {string} name - The plugin name.
   */
  init: function init(server, name) {
    // use event wildcards
    init._super.call(this, { wildcard: true });

    var self = this;


    /**
     * Instace members.
     */

    // store the server instance and our name
    this._server = server;
    this.name    = name;

    // atm, we use the server's logger
    this.logger = server.logger;

    // create a new nconf provider for the plugin config
    this.config = new nconf.Provider();

    // the local plugin root path relative to the homectrl directory
    this.root = path.resolve("plugins", name);

    // dynamic and static server root
    this.dynamicRoot = http.join(server.config.get("app:root"), "plugins", name);
    this.staticRoot  = http.join(this.dynamicRoot, "static");

    // data that is passed to template rendering
    // the keys are supposed to be the template names, e.g. "index.jade"
    this.templateData = {};

    // GET and POST helpers
    this._GET  = http.resolve(server.app, "get",  this.dynamicRoot);
    this._POST = http.resolve(server.app, "post", this.dynamicRoot);


    /**
     * Load configs.
     */

    // read all json files in "conf" directory
    fs.readdirSync(path.join(this.root, "conf")).forEach(function(file) {
      if (!util.isJsonFile(file)) {
        return;
      }

      // load the config
      self.config.file(path.join(self.root, "conf", file));
    });


    /**
     * Static mount point.
     */

    var cacheOpts   = server.config.get("cache");
    var staticMount = express.static(path.join(this.root, "static"), cacheOpts);
    server.app.use(this.staticRoot, staticMount);


    /**
     * Template rendering.
     */

    var defaultData = {
      staticRoot : this.staticRoot,
      dynamicRoot: this.dynamicRoot
    };

    this.GET("/_template", function(req, res) {
      // get the requested path
      var path = req.param("path");
      if (!path) {
        return http.send(res, 400, "missing path param");
      }

      // create the data that is passed to the rendering
      // request data
      var renderData = req.param("data") || {};
      // default data
      extend(renderData, defaultData);
      // configured template data
      if (self.templateData[path]) {
        extend(renderData, self.templateData[path]);
      }

      // render
      res.render(path, renderData);
    });


    /**
     * Message handling.
     */

    // catch and adjust emitted _outgoing_ messages
    this.on("out.*", function(socketId) {
      var event = this.event.split(".");
      var args  = Array.prototype.slice.call(arguments, 1);

      // determine the socket id(s) to send the message to
      var sockets = [];
      if (socketId == "all") {
        // send to all registered sockets
        sockets = Object.keys(self._server.sockets).map(function(id) {
          return self._server.sockets[id];
        });
      } else {
        sockets.push(self._server.sockets[socketId]);
      }

      // prepend the message event ("message.plugin"), the plugin name,
      // and the actual event to the arguments
      args = ["message.plugin", self.name, event[1]].concat(args);

      // send
      sockets.forEach(function(socket) {
        if (socket) {
          socket.emit.apply(socket, args);
        }
      });
    });
  },


  /**
   * Setup method that is called when the server successfully registered the
   * plugin.
   */
  setup: function() {
    return this;
  },


  /**
   * GET helper method. Wraps the internal `_GET` resolving function created
   * by `http.resolve`.
   *
   * @param {...string} path - The path(s) to resolve.
   * @param {...function} callback - The callback(s) to apply for this route(s).
   */
  GET: function() {
    this._GET.apply(null, arguments);
    return this;
  },


/**
   * POST helper method. Wraps the internal `_POST` resolving function created
   * by `http.resolve`.
   *
   * @param {...string} path - The path(s) to resolve.
   * @param {...function} callback - The callback(s) to apply for this route(s).
   */
  POST: function() {
    this._POST.apply(null, arguments);
    return this;
  }
});


/**
 * Export.
 */
module.exports = Plugin;
