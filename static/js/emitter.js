define(["vendor/class", "vendor/eventemitter2"], function(Class, EventEmitter2) {
  return Class._convert(EventEmitter2, "__emitter");
});
