// util.js

// node modules
var path = require("path");

// external modules
var Class         = require("node-oo"),
    EventEmitter2 = require("eventemitter2").EventEmitter2;


// create a node-oo Class based EventEmitter
var Emitter = Class._convert(EventEmitter2);


// join server root and a path
var join = function(root, path) {
  root += root[root.length - 1] != "/" ? "/" : "";
  path  = path[0] == "/" ? path.substr(1) : path;

  return root + path;
};


// returns request resolving functions, e.g.
//   GET = resolve(app, "/", "get")
//   GET("/", "/index", function(req, res) { ... }, ...)
var resolve = function(app, root, method) {
  method = method.toLowerCase();

  return function() {
    var paths    = [];
    var handlers = [];

    // loop through arguments, strings are considered as paths,
    // functions are considered as handlers
    Array.prototype.slice.call(arguments).forEach(function(arg) {
      if (typeof(arg) == "string") {
        paths.push(join(root, arg));
      } else if (typeof(arg) == "function") {
        handlers.push(arg);
      }
    });

    // mount the handlers on the paths
    paths.forEach(function(path) {
      app[method].apply(app, [path].concat(handlers));
    });

    return app;
  };
};


// collection of http errors
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


// send shorthand, compliant to the above error codes
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


module.exports = {
  Emitter: Emitter,
  http: {
    resolve: resolve,
    errors : errors,
    send   : send
  }
};
