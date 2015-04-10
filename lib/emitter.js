// emitter.js

/**
 * jclass based EventEmitter2.
 */


// npm modules
var JClass        = require("jclass");
var EventEmitter2 = require("eventemitter2").EventEmitter2,


/**
 * Export.
 */
module.exports = JClass._convert(EventEmitter2);
