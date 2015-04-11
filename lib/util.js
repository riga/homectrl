// lib/util.js

/**
 * Simple helper utilities.
 */


// node modules
var path = require("path");
var fs   = require("fs");

// npm modules
var mkdirp = require("mkdirp");


/**
 * Prepare exports.
 */

module.exports = {};


/**
 * Checks whether a file name ends with ".json".
 *
 * @param {string} name - The filename to check.
 */
module.exports.isJsonFile = function(name) {
  return /\.json$/.test(name);
};


/**
 * Creates a symlink and uses mkdirp if target directories do not exist yet.
 *
 * @param {string} src - The symlink source.
 * @param {string} dst - The symlink target.
 */
module.exports.createSymlink = function(src, dst) {
  src = path.resolve(src);
  dst = path.resolve(dst);

  // do nothing if dst already exists
  if (fs.existsSync(dst)) {
    return;
  }

  // recursively create target directories
  mkdirp.sync(path.dirname(dst));

  // create the link
  fs.symlinkSync(src, dst);
};
