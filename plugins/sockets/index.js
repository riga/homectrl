// load modules
var hc    = require("homectrl"),
    util  = require("util"),
    GPIO  = require("gpio"),
    async = require("async");


// define some constants derived from the gpio module
var IN   = "in",
    OUT  = "out",
    HIGH = 1,
    LOW  = 0;


// define and export our plugin
module.exports = exports = hc.Plugin._extend({

  // plugin method
  // invoked when all components of this plugin are set up
  setup: function() {
    this.setup._super.call(this);

    // setup gpios
    this.gpios = {
      on: this.setupGpio(this.config.get("onNum")),
      off: this.setupGpio(this.config.get("offNum")),
      switches: []
    };
    this.config.get("switches").forEach(function(data) {
      this.gpios.switches.push(this.setupGpio(data.num));
    }, this);

    // setup messages and routes
    this.setupMessages();
    this.setupRoutes();

    var logData = this.config.get("switches").map(function(data) {
      return data.label + "(" + data.num + ")";
    });
    this.logger.info("sockets: setup with on(%s), off(%s), %s",
      this.config.get("onNum"), this.config.get("offNum"), logData.join(", "));
  },

  setupGpio: function(num) {
    var gpio = GPIO.export(num, {
      direction: OUT,
      interval: 100,
      ready: function() {
        gpio.set(LOW);
      }
    });

    return gpio;
  },

  triggerSwitch: function(i, state, callback) {
    var self = this;

    var signalGpio = this.gpios[state ? "on" : "off"];
    var switchGpio = this.gpios.switches[i];

    if (!signalGpio || !switchGpio) return this;

    var tasks = function(value) {
      return [signalGpio, switchGpio].map(function(gpio) {
        return function(callback) {
          gpio.set(value, callback.bind(null, null));
        };
      });
    };
    async.parallel(tasks(HIGH), function() {
      setTimeout(function() {
        async.parallel(tasks(LOW), function() {
          (callback || function(){})(null);
        });
      }, self.config.get("delay"));
    });

    return this;
  },

  // custom method
  setupMessages: function() {
    var self = this;

    this.on("in.stateChange", function(socketId, i, state) {
      self.triggerSwitch(i, state);
    });

    return this;
  },

  // custom method
  setupRoutes: function() {
    var self = this;

    var switchData = this.config.get("switches");

    var tasks = function(value) {
      var _tasks = [];
      switchData.forEach(function(_, i) {
        _tasks.push(function(callback) {
          self.triggerSwitch(i, value, callback);
        });

        if (i < switchData.length - 1) {
          _tasks.push(function(callback) {
            setTimeout(callback.bind(null, null), 50);
          });
        }
      });
      return _tasks;
    };

    this.GET("/switches", function(req, res) {
      hc.send(res, switchData);
    });

    this.POST("/allon", function(req, res) {
      async.series(tasks(true), function() {
        hc.send(res);
      });
    });

    this.POST("/alloff", function(req, res) {
      async.series(tasks(false), function() {
        hc.send(res);
      });
    });

    return this;
  }

});
