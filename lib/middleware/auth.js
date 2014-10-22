// middleware/auth.js

// load npm modules
var auth = require("basic-auth");


module.exports = function(server) {
  var name = server.config.get("auth:user") || process.env["USER"];
  var pass = server.config.get("auth:pass");

  // default session entries
  var defaults = {};
  var setDefaults = function(session) {
    Object.keys(defaults).forEach(function(key) {
      if (session[key] === undefined) {
        session[key] = defaults[key];
      }
    });
  };

  return function(req, res, next) {
    var user = auth(req);

    if (!user || user.name !== name || user.pass !== pass) {
      res.writeHead(401, {
        "WWW-Authenticate": 'Basic realm="homectrl"'
      });
      res.end();
    } else {
      req.session.user = name;
      setDefaults(req.session);
      next();
    }
  };
};
