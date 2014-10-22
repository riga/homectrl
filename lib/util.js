// util.js

// load node modules
var events = require("events");

// load npm modules
var Class = require("node-oo");


// create a Class based EventEmitter
var Emitter = Class._convert(events.EventEmitter, "__emitter");


module.exports = {
  Emitter: Emitter
};
