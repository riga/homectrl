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
 * @param {RegExp} exceptRE - A RegExp that is used to test if a path is excepted from this
 *   middleware.
 * @returns {function} The middleware.
 */
module.exports = function(name, pass, deadtime, exceptRE) {

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
    // exception?
    if (exceptRE.test(req.path)) {
      next();
      return;
    }

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
