// middleware/auth.js

// load npm modules
var auth = require("basic-auth");


module.exports = function(name, pass, deadtime) {

  // default session entries
  var defaults = {};
  var setDefaults = function(session) {
    Object.keys(defaults).forEach(function(key) {
      if (session[key] === undefined) {
        session[key] = defaults[key];
      }
    });
  };

  var lastFailTime = (new Date()).getTime() - deadtime;

  return function(req, res, next) {
    var user = auth(req);

    if (!user || user.name !== name || user.pass !== pass) {
      res.status(401);

      var time = (new Date()).getTime();
      if (time - lastFailTime >= deadtime) {
        res.set("WWW-Authenticate", 'Basic realm="homectrl"');
      }
      lastFailTime = time;

      res.end();
    } else {
      req.session.user = name;
      setDefaults(req.session);
      next();
    }
  };
};
