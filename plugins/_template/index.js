// server-side index.js

// require the homectrl module containing "Plugin", "send" and "errors"
var hc = require("homectrl");


// define and export our plugin
// therefore, we extend (i.e. inherit from) the server-side homectrl.Plugin class
module.exports = hc.Plugin._extend({

  // plugin method
  // invoked when all components of this plugin are set up
  setup: function() {
    // call the super class' setup method
    this.setup._super.call(this);

    /*
    the following members are provided:
      logger       -> a winston logger instance
      config       -> an nconf Provider instance that loaded all files in the conf/ dir
      root         -> the root path of this plugin, e.g. /home/pi/homectrl/plugin/{{name}}
      dynamicRoot  -> the url root of this plugin, e.g. /plugins/{{name}}
      staticRoot   -> the static url root of this plugin, e.g. /plugins/{{name}}/static
      templateData -> a configurable object holding default template data, the key should be
                      the name of the template to render, e.g. "index.jade": { ... }
    */

    // setup messages and routes
    this.setupMessages();
    this.setupRoutes();

    // tell all connected sockets that we started
    // since it's an outgoing message, the event name should start with "out."
    this.emit("out.started", "all");

    // log
    this.logger.info("{{name}}: setup");
  },

  // custom method
  setupMessages: function() {
    /*
    here, you normally want to dispatch incomming messages, starting with "in.", e.g.:
      this.on("in.someTopic", function(socketId, arg1, argN) {
        // action
      });
    */

    return this;
  },

  // custom method
  setupRoutes: function() {
    /*
    here, you might want to handle incommong http requests
    using the GET and POST methods, e.g.:
      this.GET("/data", "/getdata", function(req, res) {
        // do something to retrieve data
        var data = ...

        if (typeof data === "undefined") {
          // error case
          hc.send(res, 500, "something bad happened in the {{name}} plugin");
        } else {
          // success case
          hc.send(res, data);
        }
      });
    */

    return this;
  }

});
