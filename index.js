#!/usr/bin/env node
// index.js

/**
 * homectrl startup script that handles config samples,
 * creation of symlinks and the actual server startup.
 */


// node modules
var path = require("path");
var fs   = require("fs");
var cp   = require("child_process");

// npm modules
var mkdirp = require("mkdirp");

// local modules
var util = require("./lib/util");



/**
 * Change into the project directory.
 */

process.chdir(__dirname);


/**
 * Update NODE_PATH to support imports for plugins
 * that are loaded via symlinks.
 */

var nodePath = path.join(__dirname, "node_modules");

if (typeof(process.env.NODE_PATH) != "string") {
  process.env.NODE_PATH = nodePath;
} else {
  process.env.NODE_PATH += ";" + nodePath;
}


/**
 * Create config files from samples.
 */

util.copySamples("conf");


/**
 * Create relative symlinks to simplify imports.
 */

// create a "fake" node module to be able to require "homectrl" in plugins
// node_modules/homectrl/index.js -> lib/public.js
util.createSymlink("../../lib/public.js", "node_modules/homectrl/index.js");

// make certain files available through the static mount point
util.createSymlink("../../node_modules/jclass/index.js", "static/vendor/jclass.js");
util.createSymlink("../../node_modules/eventemitter2/lib/eventemitter2.js",
                   "static/vendor/eventemitter2.js");
util.createSymlink("../../node_modules/async/lib/async.js", "static/vendor/async.js");


/**
 * Start the server.
 */

var subProcess = cp.fork("lib/server.js", process.argv.splice(2), {
  cwd: __dirname,
  env: process.env
});


/**
 * Event handling.
 */

// the sub process handles signals,
// so the main process does nothing when any signal occurs
["SIGTERM", "SIGINT", "SIGQUIT"].forEach(function(signal) {
  process.on(signal, function(){});
});

// exit when the sub process exits
subProcess.on("exit", function(code) {
  process.exit(code);
});
