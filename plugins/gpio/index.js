var hc    = require("homectrl"),
    gpio  = require("gpio"),
    async = require("async");


module.exports = hc.Plugin._extend({

  setup: function() {
    this._super();

    this.pins = {};

    // routes
    this.setupRoutes();

    // setup pins
    this.config.get("pins").forEach(this.setupPin.bind(this));

    this.logger.info("Setup gpio with pins", this.config.get("pins"));
  },

  setupRoutes: function() {
    var self = this;

    this.POST("/set", function(req, res) {
      var n = parseInt(req.param("pin"));
      if (isNaN(n)) return hc.send(res, 400, "pin is not an integer");

      var value = parseInt(req.param("value"));
      if (isNaN(value)) return hc.send(res, 400, "value is not an integer");

      self.setValue(n, value);
      hc.send(res);
    });

    this.POST("/direction", function(req, res) {
      var n = parseInt(req.param("pin"));
      if (isNaN(n)) return hc.send(res, 400, "pin is not an integer");

      var direction = req.param("direction");
      if (!direction) return hc.send(res, 400, "direction not set");

      self.setDirection(n, direction);
      hc.send(res);
    });

    this.POST("/resetall", function(req, res) {
      self.resetValues();
      hc.send(res);
    });

    return this;
  },

  setupPin: function(n, callback) {
    var self = this;

    callback = callback || function(){};

    if (this.pins[n]) return callback("pin %s already setup", n);
    var pin = this.pins = gpio.export(n, {
      direction: "out",
      interval : 100,
      ready    : function() {
        pin.on("valueChange", function(value) {
          self.sendMessage("all", "valueChange", n, value);
        });

        pin.on("directionChange", function(direction) {
          self.sendMessage("all", "directionChange", n, direction);
        });

        callback(null);
      }
    });
    return this;
  },

  setDirection: function(n, direction) {
    var pin = self.pins[n];
    if (pin) pin.setDirection(direction);
    return this;
  },

  setValue: function(n, value) {
    var pin = self.pins[n];
    if (pin) pin.set(value);
    return this;
  },

  resetValues: function() {
    Objects.keys(this.pins).forEach(function(n) {
      this.setValue(n, 0);
    }, this);
    return this;
  }

});
