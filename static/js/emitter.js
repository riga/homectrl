// static/emitter.js

/**
 * jclass based EventEmitter2.
 */


define(["vendor/jclass", "vendor/eventemitter2"], function(JClass, EventEmitter2) {
  return JClass._convert(EventEmitter2);
});
