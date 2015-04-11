// lib/middldeware/pluginrender.js


/**
 * This middleware is mounted at the plugin root.
 * When a plugin route is requested, the render middleware is updated
 * to provide templates from the plugins's "views" directory.
 */


// local modules
var http = require("../http");


/**
 * Export.
 *
 * @param server - The server instance.
 */
module.exports = function(server) {
  return function(req, res, next) {
    // get the name of the plugin
    var group = req.url.match(/^\/?([^\/]+)/);
    if (group) {
      var name = group[1];

      // wrap the render method
      res._render = res.render;
      res.render = function(templatePath) {
        var args = Array.prototype.slice.call(arguments, 1);

        // prepend the full template path
        var fullPath = "plugins/" + name + "/views/" + templatePath;
        args.unshift(fullPath);

        return this._render.apply(this, args);
      };
    }

    next();
  };
};
