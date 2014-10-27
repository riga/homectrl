var hc    = require("homectrl"),
    GPIO  = require("gpio"),
    async = require("async");


module.exports = hc.Plugin._extend({

  setup: function() {
    this._super();

    this.gpios = {};

    // routes
    this.setupRoutes();

    // setup pins
    // this.config.get("gpioNums").forEach(this.setupGpio.bind(this));
    this.config.get("gpioNums").forEach(function(num) { this.gpios[num] = {}; }, this);

    this.logger.info("gpio: setup with gpio numbers", Object.keys(this.gpios).join(", "));
  },

  setupRoutes: function() {
    var self = this;

    this.GET("/gpios", function(req, res) {
      var data = Object.keys(self.gpios).map(function(num) {
        var gpio = self.gpios[num];
        return {
          num      : num,
          direction: gpio.direction
        };
      });
      hc.send(res, data);
    });

    this.POST("/set", function(req, res) {
      var num = parseInt(req.param("gpio"));
      if (isNaN(num)) return hc.send(res, 400, "gpio is not an integer");

      var value = parseInt(req.param("value"));
      if (isNaN(value)) return hc.send(res, 400, "value is not an integer");

      self.setValue(num, value);
      hc.send(res);
    });

    this.POST("/direction", function(req, res) {
      var num = parseInt(req.param("gpio"));
      if (isNaN(num)) return hc.send(res, 400, "gpio is not an integer");

      var direction = req.param("direction");
      if (!direction) return hc.send(res, 400, "direction not set");

      self.setDirection(num, direction);
      hc.send(res);
    });

    this.POST("/resetall", function(req, res) {
      self.resetValues();
      hc.send(res);
    });

    return this;
  },

  setupGpio: function(num, callback) {
    var self = this;

    callback = callback || function(){};

    if (this.gpios[num]) return callback("gpio %s already setup", num);

    var gpio = this.gpios[num] = GPIO.export(num, {
      direction: "out",
      interval : 100,
      ready    : function() {
        gpio.set(0);

        gpio.on("valueChange", function(value) {
          self.sendMessage("all", "valueChange", num, value);
        });

        gpio.on("directionChange", function(direction) {
          self.sendMessage("all", "directionChange", num, direction);
        });

        callback(null);
      }
    });
    return this;
  },

  setDirection: function(num, direction) {
    var gpio = this.gpios[n];
    if (gpio) gpio.setDirection(direction);
    return this;
  },

  setValue: function(num, value) {
    var gpio = this.gpios[num];
    if (gpio) gpio.set(value);
    return this;
  },

  resetValues: function() {
    Object.keys(this.gpios).forEach(function(num) {
      this.setValue(num, 0);
    }, this);
    return this;
  }

});
