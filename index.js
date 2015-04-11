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
 * Create config files from samples.
 */

var samplesPath = path.join("conf", "samples");
fs.readdirSync(samplesPath).forEach(function(file) {
  var src = path.join(samplesPath, file);
  var dst = path.join("conf", file);

  // is a config file?
  var content = util.readConfig(src, false);
  if (content == null) {
    return;
  }

  // copy only if necessary
  if (!fs.existsSync(dst)) {
    fs.writeFileSync(dst, content);
  }
});


/**
 * Create symlinks to simplify imports.
 */

// create a "fake" node module to be able to require "homectrl" in plugins
// node_modules/homectrl/index.js -> lib/public.js
util.createSymlink("lib/public.js", "node_modules/homectrl/index.js");

// make certain files available through the static mount point
util.createSymlink("node_modules/jclass/index.js", "static/vendor/jclass.js");
util.createSymlink("node_modules/eventemitter2/lib/eventemitter2.js",
                   "static/vendor/eventemitter2.js");
util.createSymlink("node_modules/async/lib/async.js", "static/vendor/async.js");


/**
 * Start the server.
 */

var opts = {
  cwd: __dirname,
  env: process.env
};
cp.fork("lib/server.js", process.argv.splice(2), opts);
