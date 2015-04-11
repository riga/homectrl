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

    // mount the handlers for each path
    paths.forEach(function(path) {
      app[method].apply(app, [join(root, path)].concat(handlers));
    });

    return app;
  };
};


/**
 * Helper function to send json formatted responses.
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
 * @param {string} [message=null] - A custom message in case an error is sent.
 */
module.exports.send = function(res, data, message) {
  var response;

  if (typeof(data) == "number" && data in statusCodes && data != 200) {
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
};
