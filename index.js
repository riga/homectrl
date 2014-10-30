#!/usr/bin/env node
// index.js

// node modules
var path = require("path"),
    fs   = require("fs"),
    cp   = require("child_process");

// external modules
var mkdirp = require("mkdirp");


// copy json config files from samples if not present yet
var confPath   = "conf";
var samplePath = path.join(confPath, "samples");
fs.readdirSync(samplePath).forEach(function(file) {
  // a json file?
  if (!/\.json$/.test(file)) {
    return;
  }

  var src = path.join(samplePath, file);
  var dst = path.join(confPath,   file);

  if (!fs.existsSync(dst)) {
    fs.writeFileSync(dst, fs.readFileSync(src));
  }
});


// creates symlinks, uses mkdirp if target folders do not exist yet
var symlink = function(src, dst) {
  if (fs.existsSync(dst)) return;
  var dstDir = path.dirname(dst);
  mkdirp.sync(dstDir);
  fs.symlinkSync(src, dst);
};

// create a symlink node_modules/homectrl/index.js -> lib/public.js
// to be able to require "homectrl" in plugins
symlink("lib/public.js", "node_modules/homectrl/index.js");

// create symlinks to make files available on client-side
symlink("node_modules/node-oo/index.js", "static/vendor/class.js");
symlink("node_modules/eventemitter2/lib/eventemitter2.js", "static/vendor/eventemitter2.js");


// finally, fork the actual server
var opts = {
  cwd: __dirname,
  env: process.env
};
cp.fork("lib/server.js", process.argv.splice(2), opts);
