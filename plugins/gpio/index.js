var hc    = require("homectrl"),
    GPIO  = require("gpio");


module.exports = hc.Plugin._extend({

  setup: function() {
    this._super();

    this.gpios = {};

    // routes
    this.setupRoutes();

    // setup pins
    this.config.get("gpioNums").forEach(this.setupGpio.bind(this));

    this.logger.info("gpio: setup with gpio numbers", Object.keys(this.gpios).join(", "));
  },

  setupRoutes: function() {
    var self = this;

    this.GET("/gpios", function(req, res) {
      var data = Object.keys(self.gpios).map(function(num) {
        var gpio = self.gpios[num];
        return {
          num      : parseInt(num),
          value    : gpio.value,
          direction: gpio.direction
        };
      });
      hc.send(res, data);
    });

    this.POST("/resetall", function(req, res) {
      self.resetValues();
      hc.send(res);
    });

    return this;
  },

  setupGpio: function(num) {
    var self = this;

    if (this.gpios[num]) return this;

    var gpio = this.gpios[num] = GPIO.export(num, {
      direction: "out",
      interval : 100,
      ready    : function() {
        gpio.on("valueChange", function(value) {
          self.sendMessage("all", "valueChange", num, value);
        });

        gpio.on("directionChange", function(direction) {
          self.sendMessage("all", "directionChange", num, direction);
        });

        gpio.set(0);
      }
    });
    return this;
  },

  setDirection: function(num, direction) {
    var gpio = this.gpios[num];
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
  },

  onMessage: function(socketId, topic, num, value) {
    if (topic == "valueChange") {
      this.setValue(num, value);
    } else if (topic == "directionChange") {
      this.setDirection(num, value);
    }

    return this;
  }
});
