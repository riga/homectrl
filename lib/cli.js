// cli.js

// node modules
var fs   = require("fs"),
    path = require("path");

// local modules
var types     = require("./util.js").types,
    createCli = require("./util.js").createCli;


// define the actual cli argumets
var args = [
  {
    name: "-H, --host [HOST]",
    desc: "the server host to use"
  }, {
    name: "-P, --port [PORT]",
    desc: "the server port to use",
    type: types.num
  }, {
    name: "-R, --root [PATH]",
    desc: "the server root to use"
  }, {
    name: "-l, --log-file [FILE]",
    desc: "a log file, an absolute path is recommended",
    type: types.userPath
  }
];


module.exports = function(argv) {
  // get the version from the package file
  var packageData = fs.readFileSync("package.json");
  var version = JSON.parse(packageData).version;

  var cli = createCli(args, "node .", version);

  return cli.parse(argv || process.argv);
};
