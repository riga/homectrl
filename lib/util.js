// lib/util.js

/**
 * Simple helper utilities.
 */


// node modules
var path = require("path");
var fs   = require("fs");

// npm modules
var mkdirp = require("mkdirp");
var YAML   = require("yamljs");


/**
 * Prepare exports.
 */

module.exports = {};


/**
 * Checks whether a file can be read and parsed as a config.
 * Returns the parsed config (default) or the raw content.
 *
 * @param {string} file - The path of the file to check.
 * @param {bool} [parse=true]
 * @returns {object|null}
 */
module.exports.readConfig = function(file, parse) {
  if (parse === undefined) {
    parse = true;
  }

  // load the content
  var content = fs.readFileSync(file, { encoding: "utf8" });

  // YAML covers json as well
  try {
    var config = YAML.parse(content);
    return parse ? config : content;
  } catch (err) {
    return err;
  }
};


/**
 * Creates a symlink and uses mkdirp if target directories do not exist yet.
 *
 * @param {string} src - The symlink source.
 * @param {string} dst - The symlink target.
 */
module.exports.createSymlink = function(src, dst) {
  // do nothing if dst already exists
  if (fs.existsSync(dst)) {
    return;
  }

  // recursively create target directories
  mkdirp.sync(path.dirname(dst));

  // create the link
  fs.symlinkSync(src, dst);
};
