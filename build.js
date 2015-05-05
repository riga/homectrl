#!/usr/bin/env node
// build.js

/**
 * Build html files from jade templates located at src/.
 */


// node modules
var fs   = require("fs");
var path = require("path");

// npm modules
var jade = require("jade");


/**
 * Define source files w/o extension.
 */

var files = ["index"];


/**
 * Jade compile options.
 */

var jadeOpts = {
  pretty: true,
  cache: false,
  debug: false
};


/**
 * Actual compilation of all files.
 */

files.forEach(function(page) {
  var src = path.join(__dirname, "src", page + ".jade");
  var dst = path.join(__dirname, page + ".html");

  fs.writeFileSync(dst, jade.compileFile(src, jadeOpts)());
});
