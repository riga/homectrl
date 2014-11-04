define(["vendor/jclass", "vendor/eventemitter2"], function(Class, EventEmitter2) {
  // use jclass' Class conversion functionality to create an (Event)Emitter
  // in jclass style
  return Class._convert(EventEmitter2);
});
