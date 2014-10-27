// plugins.js

// load node modules
var fs   = require("fs"),
    path = require("path");

// load npm modules
var express = require("express"),
    nconf   = require("nconf");

// load local modules
var Emitter = require("./util.js").Emitter,
    http    = require("./util.js").http;


var AbstractPlugin = Emitter._extend({

  init: function(server, name) {
    this._super();

    this._server = server;
    this.name    = name;

    this.logger = server.logger;
    this.config = new nconf.Provider();
    this.root   = path.resolve("plugins", name);

    // read all json files in conf folder
    fs.readdirSync(path.join(this.root, "conf")).forEach(function(file) {
      var match = file.match(/^(.+)\.json$/);
      if (!match) return;
      this.config.file(match[1], path.join(this.root, "conf", file));
    }, this);

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
    this.GET("/template", function(req, res) {
      var path = req.param("path");
      if (!path) return http.send(res, 400, "missing path param");

      var data = req.param("data");
      if (!data) data = {};

      res.render(path, data);
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
  },

  onMessage: function(socketId, topic) {
    return this;
  },

  sendMessage: function(socketId, topic) {
    var socket = this._server.sockets[socketId];
    if (socket) {
      var args = Array.prototype.slice.call(arguments, 2);
      args = ["message.plugin", this.name, topic].concat(args);
      socket.emit.apply(socket, args);
    }
    return this;
  }
});


module.exports = AbstractPlugin;
