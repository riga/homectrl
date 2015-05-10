// lib/http.js

/**
 * Small collection of helper functions for http communication.
 */


// node modules
var path = require("path");
var util = require("util");

// npm modules
var statusCodes = require("http-status");


/**
 * Prepare exports.
 */

module.exports = {};


/**
 * Join and normalize paths. Same as node's `path.join`, except that there will
 * be both a leading slash and a trailing slash.
 *
 * @example
 * join("/myRoot", "somePath") // returns "/myRoot/somePath/"
 *
 * @param {...string} path1 - Path components to join.
 */
var join = module.exports.join = function() {
  var p = path.join.apply(path, arguments);

  // add trailing slash
  if (p.substr(-1) != "/") {
    p += "/";
  }

  // add leading slash
  if (p[0] != "/") {
    p = "/" + p;
  }

  return p;
};


/**
 * Create request resolving functions for an express app with a server root
 * for a given http method.
 *
 * @example
 * var GET = resolve(myApp, "get", "/myRoot");
 * GET("/", "/index", function(req, res) { ... });
 *
 * @param {ExpressApp} app - The express app to use.
 * @param {string} method - Http method to resolve ("get", "post", ...).
 * @param {string} [root=/] - The app's server root.
 */
module.exports.resolve = function(app, method, root) {
  method = method.toLowerCase();

  if (root === undefined) {
    root = "/";
  }

  // helper function to parse custom errors thrown in handler domains
  // possible "throw" statements:
  // throw new Error("my error")
  // throw new Error(500)
  // throw "my error"
  // throw 500
  // throw { message: "my error", code: 500 }
  var parseError = function(err) {
    var code    = 500;
    var message = undefined;

    if (err instanceof Error) {
      var _message = err.message;
      var _code    = parseInt(message);
      if (!isNaN(_code)) {
        code = _code
      } else {
        message = _message;
        if ("code" in err) {
          code = err.code;
        }
      }
    } else if (typeof(err) == "object") {
      if ("code" in err) {
        code = err.code;
      }
      if ("message" in err) {
        message = err.message;
      }
    } else if (typeof(err) == "string") {
      message = err;
    } else if (typeof(err) == "number") {
      code = err;
    }

    return { code: code, message: message };
  };

  return function() {
    // loop through arguments, strings are considered as paths,
    // functions are considered as handlers

    var paths    = [];
    var handlers = [];

    Array.prototype.slice.call(arguments).forEach(function(arg) {
      if (typeof(arg) == "string") {
        paths.push(arg);
      } else if (typeof(arg) == "function") {
        handlers.push(arg);
      }
    });

    // run handlers in try-catch blocks to catch and wrap errors
    // in well-defined response objects
    handlers = handlers.map(function(handler) {
      return function(req, res) {
        try {
          handler(req, res);
        } catch (err) {
          var err = parseError(err);
          send(res, err.code, err.message);
        }
      }
    });

    // mount the handlers for each path
    paths.forEach(function(path) {
      app[method].apply(app, [join(root, path)].concat(handlers));
    });

    return app;
  };
};


/**
 * Helper function to send json formatted responses. Each json object has three fields:
 * code, data and message. See parameters for explanation. Note that this function does not set
 * http status code of the response object.
 *
 * @example
 * send(res);               // sends "{code: 200, data: null, message: null}"
 * send(res, "foo");        // sends "{code: 200, data: "foo", message: null}"
 * send(res, {a:1});        // sends "{code: 200, data: {a:1}, message: null}"
 * send(res, 400);          // sends "{code: 400, data: null, message: 'Bad Request'}"
 * send(res, 400, "myMsg"); // sends "{code: 400, data: null, message: 'myMsg'}"
 *
 * @param {ExpressResponse} res - The response object.
 * @param {number|*} [data=200] - The data to send. Sends an error, when `data`
 *   is a number (except 200). In this case, `message` defaults to the proper
 *   http status message.
 * @param {string} [message=null] - A custom message in case an error of an error.
 * @returns {response} The response object.
 */
var send = module.exports.send = function(res, data, message) {
  var response;

  if (typeof(data) == "number" && data != 200) {
    response = {
      code   : data,
      data   : null,
      message: message === undefined ? statusCodes[data] : message
    };
  } else {
    response = {
      code   : 200,
      data   : data === undefined ? null : data,
      message: null
    };
  }

  res.json(response);

  return res;
};
