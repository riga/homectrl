// lib/cli.js

/**
 * Setup of the command line interface based on commander.
 */


// node modules
var fs   = require("fs");
var path = require("path");

// npm modules
var cli = require("commander");


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
 * CLI definition.
 */

cli._name = "node .";
cli.version(JSON.parse(fs.readFileSync("package.json")).version);
cli.description("Starts the homectrl server.");

[
  {
    name: "-H, --host [HOST]",
    desc: "the server host to use, e.g. 'localhost'"
  }, {
    name: "-P, --port [PORT]",
    desc: "the server port to use, e.g. '80'",
    type: parseInt
  }, {
    name: "-R, --root [PATH]",
    desc: "the server root to use, e.g. '/homectrl'"
  }, {
    name: "-l, --log-file [FILE]",
    desc: "a log file; an absolute path is recommended",
    type: userPath
  }
].forEach(function(arg) {
  cli.option(arg.name, arg.desc, arg.type || noType, arg.dflt);
});


/**
 * Export.
 *
 * @param {array} [argv=process.argv] - Commandline arguments to parse.
 */
module.exports = function(argv) {
  return cli.parse(argv === undefined ? process.argv : argv);
};
