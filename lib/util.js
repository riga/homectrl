// util.js

// load npm modules
var Class        = require("node-oo"),
    EventEmitter = require("eventemitter2").EventEmitter2;


// create a Class based EventEmitter
var Emitter = Class._convert(EventEmitter, "__emitter");


module.exports = {
  Emitter: Emitter
};
