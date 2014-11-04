// plugins.js

// node modules
var fs   = require("fs"),
    path = require("path"),
    util = require("util");

// external modules
var express = require("express"),
    nconf   = require("nconf");

// local modules
var Emitter = require("./util.js").Emitter,
    http    = require("./util.js").http;


var Plugin = Emitter._extend({

  init: function(server, name) {
    // we use EE2 wildcards
    this.init._super.call(this, { wildcard: true });

    var self = this;

    this._server = server;
    this.name    = name;

    this.logger       = server.logger;
    this.config       = new nconf.Provider();
    this.root         = path.resolve("plugins", name);
    this.templateData = {};

    // read all json files in conf folder
    fs.readdirSync(path.join(this.root, "conf")).forEach(function(file) {
      var match = file.match(/^(.+)\.json$/);
      if (!match) return;
      self.config.file(match[1], path.join(self.root, "conf", file));
    });

    // static mount point
    var staticRoot = server.config.get("app:root") + "plugins/" + name + "/static";
    var staticDir  = path.join(this.root, "static");
    var cacheOpts  = server.config.get("cache");
    server.app.use(staticRoot, express.static(staticDir, cacheOpts));

    // GET and POST helpers
    var dynamicRoot = server.config.get("app:root") + "plugins/" + name + "/";
    this._GET  = http.resolve(server.app, dynamicRoot, "get");
    this._POST = http.resolve(server.app, dynamicRoot, "post");

    // render templates
    this.GET("/_template", function(req, res) {
      var path = req.param("path");
      if (!path) return http.send(res, 400, "missing path param");

      var data = req.param("data");
      if (!data) data = {};

      var tmplData = util._extend({}, self.templateData[path] || {});

      res.render(path, util._extend(tmplData, data));
    });

    // catch and adjust emitted outgoing messages
    this.on("out.*", function(socketId) {
      var args  = Array.prototype.slice.call(arguments, 1);
      var event = this.event.split(".");

      var sockets = [];
      if (socketId == "all") {
        sockets = Object.keys(self._server.sockets).map(function(id) {
          return self._server.sockets[id];
        });
      } else {
        sockets.push(self._server.sockets[socketId]);
      }

      args = ["message.plugin", self.name, event[1]].concat(args);

      sockets.forEach(function(socket) {
        if (socket) socket.emit.apply(socket, args);
      });
    });
  },

  setup: function() {
    return this;
  },

  GET: function() {
    this._GET.apply(null, arguments);
    return this;
  },

  POST: function() {
    this._POST.apply(null, arguments);
    return this;
  }
});


module.exports = Plugin;
