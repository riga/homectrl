// middleware/auth.js

// external modules
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

  // store the timestamp of the last failed auth process
  var lastFailTime = (new Date()).getTime() - deadtime;

  return function(req, res, next) {
    var user = auth(req);

    if (!user || user.name !== name || user.pass !== pass) {
      var time = (new Date()).getTime();

      if (time - lastFailTime < deadtime) {
        res.status(403);
      } else {
        res.status(401);
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
