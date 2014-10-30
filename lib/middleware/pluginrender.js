// middleware/pluginrender.js


// this middleware is mounted at the plugin root
// when a plugin route is requests, update the render middleware
// to provide templates from the plugins's views directories
module.exports = function(server) {
  return function(req, res, next) {
    // get the name of the plugin
    var group = req.url.match(/^\/?([^\/]+)/);
    if (group) {
      var name = group[1];

      // wrap the render method
      res._render = res.render;
      res.render = function(tmplPath) {
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift("plugins/" + name + "/views/" + tmplPath);
        return this._render.apply(this, args);
      };
    }

    next();
  };
};
