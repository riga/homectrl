// lib/plugin.js

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
var winston = require("winston");
var less    = require("less-middleware");

// local modules
var Emitter = require("./emitter");
var http    = require("./http");
var util    = require("./util");


/**
 * Export our plugin class definition.
 */

module.exports = Emitter._extend({

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

    // store a reference to the server
    this.server = server;

    // store our name
    this.name = name;

    // create a logger
    this.logger = new winston.Logger(server.loggerConfig);
    this.logger.name = name;

    // create a new nconf provider for the plugin config
    this.config = new nconf.Provider();

    // the local plugin root path relative to the homectrl directory
    this.localRoot = path.resolve("plugins", name);

    // dynamic and static server root
    this.dynamicRoot = http.join(server.config.get("app:root"), "plugins", name);
    this.staticRoot  = http.join(this.dynamicRoot, "static");

    // data that is passed to template rendering
    // the keys are supposed to be the template names, e.g. "index.jade"
    this.templateData = {};

    // GET and POST helpers
    this._GET  = http.resolve(server.app, "get",  this.dynamicRoot);
    this._POST = http.resolve(server.app, "post", this.dynamicRoot);

    // locales
    this.locales = {};


    /**
     * Load configs.
     */

    // read all json files in "conf" directory
    fs.readdirSync(path.join(this.localRoot, "conf")).forEach(function(name) {
      var file = path.join(self.localRoot, "conf", name);

      // skip anything but files
      if (!fs.statSync(file).isFile()) {
        return;
      }

      // skip files starting with an underscore
      if (name[0] == "_") {
        return;
      }

      var data = util.readConfig(file);

      if (data instanceof Error) {
        self.logger.error("failed to load config from '%s': %s", file, data.message);
      } else {
        self.config.add(name, { type: "literal", store: data });
      }
    });


    /**
     * Additional middleware.
     */

    // less
    server.app.use(this.staticRoot, less(path.join(this.localRoot, "static"), server.lessConfig));

    // static mount point
    var cacheOpts = server.config.get("cache");
    server.app.use(this.staticRoot, express.static(path.join(this.localRoot, "static"), cacheOpts));


    /**
     * Template rendering.
     */

    var defaultData = {
      staticRoot : this.staticRoot,
      dynamicRoot: this.dynamicRoot
    };

    this.GET("/_template", function(req, res) {
      // get the requested path
      var path = req.query.path;
      if (!path) {
        return http.send(res, 400, "missing path param");
      }

      // build the full template path
      var fullPath = "plugins/" + name + "/views/" + path;

      // create the data that is passed to the rendering
      // request data
      var renderData = req.query.data || {};
      // default data
      extend(renderData, defaultData);
      // configured template data
      if (self.templateData[path]) {
        extend(renderData, self.templateData[path]);
      }
      // locales
      renderData.locales = self.locales[req.lang] || self.locales.en;

      // render
      server.app.render(fullPath, renderData, function(err, content) {
        if (err) {
          http.send(res, 500, err.message);
        } else {
          http.send(res, content);
        }
      });
    });


    /**
     * Socket message handling.
     */

    // catch and adjust emitted _outgoing_ messages
    this.on("out.*", function(socketId) {
      var args = Array.prototype.slice.call(arguments, 1);

      var event = this.event.split(".");
      var topic = event[1];

      // determine the socket id(s) to send the message to
      var sockets = [];
      if (socketId == "all") {
        // send to all registered sockets
        sockets = Object.keys(server.sockets).map(function(id) {
          return server.sockets[id];
        });
      } else {
        sockets.push(server.sockets[socketId]);
      }

      // prepend the message topic ("message.plugin"), the plugin name,
      // and the actual event to the arguments
      args = ["message.plugin", self.name, topic].concat(args);

      // send
      sockets.forEach(function(socket) {
        if (socket) {
          var msg = "outgoing message: %s (%s)";
          self.logger.debug(msg, topic, socket.id);

          socket.emit.apply(socket, args);
        }
      });
    });


    /**
     * Load locales.
     */

    server.config.get("client:availableLanguages").forEach(function(lang) {
      try {
        var file = path.join(self.localRoot, "locales", lang + ".json");
        var data = fs.readFileSync(file, { encoding: "utf8" });
        self.locales[lang] = JSON.parse(data);
      } catch (err) {
        self.logger.error("cannot load locales: %s", err.message);
      }
    });


    this.logger.debug("initialized");
  },


  /**
   * Setup method that is called when the server successfully registered the
   * plugin.
   *
   * @returns {this}
   */
  setup: function() {
    return this;
  },


  /**
   * Shutdown method that is called when the server received a shutdown signal. A plugin that
   * overrides this method should either call the callback itself, or call _this_ super method
   * instead. It might not be useful to call this method manually.
   *
   * @param {string} signal - The signal received by the server.
   * @param {function} callback - A function that should be called when the plugins shutdown is
   *   finished. The server shutdown cannot be aborted, hence, it does not except an error.
   * @returns {this}
   */
  shutdown: function(signal, callback) {
    this.logger.info("shutdown");

    callback(null);

    return this;
  },


  /**
   * GET helper method. Wraps the internal `_GET` resolving function created
   * by `http.resolve`.
   *
   * @param {...string} path - The path(s) to resolve.
   * @param {...function} callback - The callback(s) to apply for this route(s).
   * @returns {this}
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
   * @returns {this}
   */
  POST: function() {
    this._POST.apply(null, arguments);

    return this;
  },


  /**
   * Prefixes a string with the plugin name ("<name>.<string>").
   *
   * @param {string} s - The string to prefix.
   * @returns {string}
   */
  prefix: function(s) {
    return this.name + "." + s;
  }
});
