// util.js

// node modules
var path = require("path");

// external modules
var Class         = require("jclass"),
    EventEmitter2 = require("eventemitter2").EventEmitter2,
    commander     = require("commander");


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


// some simple type converters, used in cli
var noType = function(val) {
  return val;
};

var num = function(val) {
  return parseFloat(val);
};

var userPath = function(val) {
  var home = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
  ["~", "$HOME", "%USERPROFILE%"].forEach(function(s) {
    if (val.substr(0, s.length) == s) {
      val = home + val.substr(s.length);
    }
  });
  return val;
};


// cli helper
var createCli = function(args, name, version) {
  if (typeof name    === "undefined") name    = "node .";
  if (typeof version === "undefined") version = "0.0.0";

  // create a new commander Command instance
  var cli = new commander.Command();

  // apply the args
  args.forEach(function(arg) {
    cli.option(arg.name, arg.desc, arg.type || noType, arg.dflt);
  });

  // set name and version and return the cli
  cli._name = name;
  return cli.version(version);
};


module.exports = {
  Emitter: Emitter,
  http: {
    resolve: resolve,
    errors : errors,
    send   : send
  },
  types: {
    noType : noType,
    num    : num,
    uerPath: userPath
  },
  createCli: createCli
};
