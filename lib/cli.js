// lib/cli.js

/**
 * Setup of the command line interface based on argparse.
 */


// node modules
var fs   = require("fs");
var path = require("path");

// npm modules
var ArgumentParser = require("argparse").ArgumentParser;

// local modules
var util = require("./util");


/**
 * Simple type converters.
 */

/**
 * Trivial type converter.
 *
 * @param value - The value to return (trivial).
 */
var noType = function(value) {
  return value;
};

/**
 * Expands "~" and "$HOME" at the beginning of a path.
 *
 * @param {string} value - The path to expand.
 */
var userPath = function(value) {
  var home = process.env.HOME;

  ["~", "$HOME"].forEach(function(s) {
    if (value.substr(0, s.length) == s) {
      value = home + value.substr(s.length);
    }
  });

  return value;
};


/**
 * Setup the ArgumentParser.
 */

var parser = new ArgumentParser({
  description: "Starts the homectrl server.",
  version    : util.readConfig("package.json").version,
  prog       : "node ."
});

parser.addArgument(["--host", "-H"], {
  help: "the server host to use, e.g. 'localhost'"
});

parser.addArgument(["--port", "-P"], {
  help: "the server port to use, e.g. '80'",
  type: parseInt
});

parser.addArgument(["--root", "-R"], {
  help: "the server root to use, e.g. '/homectrl'"
});

parser.addArgument(["--logfile", "-l"], {
  help: "a log file to use; an absolute path is recommended",
  type: userPath,
  dest: "logFile"
});


/**
 * Export.
 *
 * @returns {object}
 */
module.exports = function() {
  return parser.parseArgs();
};
