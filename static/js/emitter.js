define(["vendor/Class", "vendor/eventemitter2"], function(Class, EventEmitter2) {
  return Class._convert(EventEmitter2, "__emitter");
});
