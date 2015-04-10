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
    desc: "the server host to use, e.g. 'localhost'"
  }, {
    name: "-P, --port [PORT]",
    desc: "the server port to use, e.g. '80'",
    type: types.num
  }, {
    name: "-R, --root [PATH]",
    desc: "the server root to use, e.g. 'homectrl/'"
  }, {
    name: "-l, --log-file [FILE]",
    desc: "a log file; an absolute path is recommended",
    type: types.userPath
  }
];


module.exports = function(argv) {
  // read the package file
  var packageData = JSON.parse(fs.readFileSync("package.json"));

  var cli = createCli(args, "node .", packageData.version);

  return cli.parse(argv || process.argv);
};
