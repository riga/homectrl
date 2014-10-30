define(["vendor/class", "vendor/eventemitter2"], function(Class, EventEmitter2) {
  // use node-oo's Class conversion functionality to create an (Event)Emitter
  // is node-oo Class style
  return Class._convert(EventEmitter2);
});
