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
 * Returns the parsed config (default), the raw content, or
 * an error.
 *
 * @param {string} file - The path of the file to check.
 * @param {bool} [parse=true]
 * @returns {object|error}
 */
var readConfig = module.exports.readConfig = function(file, parse) {
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
 * Copy sample config files from a directory <target>/samples to <target>.
 *
 * @param {string} target - The target directory.
 */
module.exports.copySamples = function(target) {
  var samplesPath = path.join(target, "samples");

  fs.readdirSync(samplesPath).forEach(function(file) {
    var src = path.join(samplesPath, file);
    var dst = path.join(target, file);

    // is it a config file?
    var content = readConfig(src, false);
    if (content instanceof Error) {
      return;
    }

    // copy only if necessary
    if (!fs.existsSync(dst)) {
      fs.writeFileSync(dst, content);
    }
  });
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
