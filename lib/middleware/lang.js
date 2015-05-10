// lib/middleware/lang.js


/**
 * Get the .
 */


/**
 * Export.
 *
 * @param {string} lang - The desired language. When set to "auto", the language is determined by
 *   passing `available` to `req.acceptsLanguage`. Defaults to "en".
 * @param {array} available - All available languages.
 * @returns {function} The middleware.
 */
module.exports = function(lang, available) {

  return function(req, res, next) {
    if (lang == "auto") {
      lang = req.acceptsLanguages(available) || "en";
    }

    req.lang = lang;

    next();
  };
};
