// cli.js

// load node modules
var fs   = require("fs"),
    path = require("path");

// load npm modules
var cli = require("commander");


// define types
var noType = function(val) {
  return val;
};
var num = function(val) {
  return parseFloat(val);
};
var userPath = function(val) {
  var home = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
  ["~", "$HOME", "%USERPROFILE%"].forEach(function(s) {
    if (val.substr(0, s.length) == s) {
      val = home + val.substr(s.length);
    }
  });
  return val;
};

var args = [
  {
    name: "-H, --host [HOST]",
    desc: "the server host to use"
  }, {
    name: "-P, --port [PORT]",
    desc: "the server port to use",
    type: num
  }, {
    name: "-R, --root [PATH]",
    desc: "the server root to use"
  }, {
    name: "-l, --log-file [FILE]",
    desc: "a log file, an absolute path is recommended",
    type: userPath
  }
];

args.forEach(function(arg) {
  cli.option(arg.name, arg.desc, arg.type || noType, arg.dflt);
});


module.exports = function(argv) {
  var packageData = fs.readFileSync("package.json");
  var version = JSON.parse(packageData).version;
  cli._name = "node .";
  return cli.version(version).parse(argv || process.argv);
};
