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

    this.name   = name;
    this.logger = server.logger;
    this.config = new nconf.Provider();
    this.root   = path.resolve("plugins", name);

    // static mount point
    var staticRoot = server.config.get("app:root") + "plugins/" + name + "/static";
    var staticDir  = path.join(this.root, "static");
    var cacheOpts  = server.config.get("cache");
    server.app.use(staticRoot, express.static(staticDir, cacheOpts));

    // GET and POST helpers
    var dynamicRoot = server.config.get("app:root") + "plugins/" + name;
    this._GET  = http.resolve(server.app, dynamicRoot, "get");
    this._POST = http.resolve(server.app, dynamicRoot, "post");
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


module.exports = AbstractPlugin;
