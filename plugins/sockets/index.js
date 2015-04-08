// load modules
var hc    = require("homectrl"),
    util  = require("util"),
    async = require("async"),
    exec  = require("child_process").exec;


// define and export our plugin
module.exports = exports = hc.Plugin._extend({

  // plugin method
  // invoked when all components of this plugin are set up
  setup: function() {
    this.setup._super.call(this);

    // setup messages and routes
    this.setupMessages();
    this.setupRoutes();

    var logData = this.config.get("sockets").map(function(socket) {
      return socket.label + "(" + socket.descr + ")";
    });
    this.logger.info("sockets: %s", logData.join(", "));
  },

  triggerSocket: function(i, state, callback) {
    var self = this;

    if (callback === undefined) {
      callback = function(){};
    }

    var socket = this.config.get("sockets")[i];
    if (!socket) {
      callback("undefined socket " + i);
      return this;
    }

    var tasks    = [];
    var cmd      = [this.config.get("command"), socket.code, state ? "1" : "0"].join(" ");
    var nSignals = this.config.get("nSignals");
    var timeout  = this.config.get("timeout");

    for (var i = 0; i < nSignals; ++i) {
      tasks.push(function(callback) {
        exec(cmd, callback);
      });
      if (i + 1 < nSignals) {
        tasks.push(function(callback) {
          setTimeout(callback.bind(null, null), timeout);
        });
      }
    }

    async.series(tasks, function(err) {
      if (err) {
        self.logger.error(err);
        return callback(err);
      }

      self.logger.debug("sockets: switch %s %s(%s)",
        state ? "on" : "off", socket.label, socket.descr);

      callback(null);
    });

    return this;
  },

  // custom method
  setupMessages: function() {
    var self = this;

    this.on("in.stateChange", function(socketId, i, state) {
      self.triggerSocket(i, state);
    });

    return this;
  },

  // custom method
  setupRoutes: function() {
    var self = this;

    var sockets = this.config.get("sockets");

    var allTasks = function(state) {
      return sockets.map(function(_, i) {
        return function(callback) {
          self.triggerSocket(i, state, callback);
        }
      });
    };

    this.GET("/sockets", function(req, res) {
      hc.send(res, sockets);
    });

    this.POST("/allon", function(req, res) {
      async.series(allTasks(true), function() {
        hc.send(res);
      });
    });

    this.POST("/alloff", function(req, res) {
      async.series(allTasks(false), function() {
        hc.send(res);
      });
    });

    return this;
  }

});
