// routes.js

// load node modules
var util = require("util");

// load npm modules
var uuid  = require("uuid").v4,
    async = require("async");

// load local modules
var Emitter = require("./util.js").Emitter;


var routes = function(server) {
  // shorthands
  var logger  = server.logger;
  var app     = server.app;
  var root    = server.config.get("app:root");

  logger.info("Setup routes");

  // helpers
  var route = function(path) {
    path = path[0] == "/" ? path.substr(1) : path;
    return root + path;
  };
  var resolve = function(method) {
    method = method.toLowerCase();
    return function() {
      var paths    = [];
      var handlers = [];
      Array.prototype.slice.call(arguments).forEach(function(arg) {
        if (typeof(arg) == "string") {
          paths.push(route(arg));
        } else if (typeof(arg) == "function") {
          handlers.push(arg);
        }
      });
      paths.forEach(function(path) {
        app[method].apply(app, [path].concat(handlers));
      });
      return app;
    };
  };
  var GET  = resolve("get");
  var POST = resolve("post");

  var errors = {
    400         : { code: 400, message: "bad request" },
    badreq      : { code: 400, message: "bad request" },
    401         : { code: 401, message: "unauthorized" },
    unauthorized: { code: 401, message: "unauthorized" },
    403         : { code: 403, message: "forbidden" },
    forbidden   : { code: 403, message: "forbidden" },
    500         : { code: 500, message: "internal server error" },
    internal    : { code: 500, message: "internal server error" }
  };
  var send = function(res, data, message) {
    var obj;

    if (data in errors) {
      obj = util._extend({ data: null }, errors[data]);
      obj.message = message || obj.message;
    } else {
      obj = {
        code: 200,
        data: data || null,
        message: null
      }
    }

    res.json(obj);
  };

  // routes
  GET("/", "/index", function(req, res) {
    res.render("index.jade", { user: req.session.user });
  });

};


module.exports = routes;
