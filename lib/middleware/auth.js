// lib/middleware/auth.js


/**
 * Authentication middleware based on http basic auth.
 */


// npm modules
var auth = require("basic-auth");


/**
 * Export.
 *
 * @param {string} name - User name.
 * @param {string} pass - User password.
 * @param {number} deadtime - Time in ms during which no authentication is
 *   possible after a failed attempt.
 */
module.exports = function(name, pass, deadtime) {

  // manage default session entries
  // (nothing yet)
  var defaults = {};
  var setDefaults = function(session) {
    for (var key in defaults) {
      if (session[key] === undefined) {
        session[key] = defaults[key];
      }
    }
  };

  // store the timestamp of the last failed attempt,
  var lastFailTime = 0;

  return function(req, res, next) {
    var user = auth(req);

    if (!user || user.name !== name || user.pass !== pass) {
      // the session is not yet authenticated
      var time = (new Date()).getTime();

      if (time - lastFailTime < deadtime) {
        // last failed attempt within deadtime
        res.status(403);
      } else {
        res.status(401);
        res.set("WWW-Authenticate", 'Basic realm="homectrl"');
      }

      lastFailTime = time;

      res.end();
    } else {
      // authenticated session
      req.session.user = name;
      setDefaults(req.session);
      next();
    }
  };
};
