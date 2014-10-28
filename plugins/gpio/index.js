var hc    = require("homectrl"),
    GPIO  = require("gpio");


var IN   = "in",
    OUT  = "out",
    HIGH = 1,
    LOW  = 0;


module.exports = hc.Plugin._extend({

  setup: function() {
    this._super();

    // setup gpios
    this.gpios = {};
    this.config.get("gpioNums").forEach(this.setupGpio.bind(this));

    // messages and routes
    this.setupMessages();
    this.setupRoutes();

    this.logger.info("gpio: setup with gpio numbers", Object.keys(this.gpios).join(", "));
  },

  setupGpio: function(num) {
    var self = this;

    if (this.gpios[num]) return this;

    var gpio = this.gpios[num] = GPIO.export(num, {
      direction: OUT,
      interval : 100,
      ready    : function() {
        gpio.on("valueChange", function(value) {
          self.emit("out.valueChange", "all", num, value);
        });

        gpio.on("directionChange", function(direction) {
          self.emit("out.directionChange", "all", num, direction);
          if (direction == OUT) gpio.set(LOW);
        });

        gpio.set(LOW);
      }
    });
    return this;
  },

  setupMessages: function() {
    var self = this;

    this.on("in.valueChange", function(socketId, num, value) {
      var gpio = self.gpios[num];
      if (gpio) gpio.set(value);
    });

    this.on("in.directionChange", function(socketId, num, direction) {
      var gpio = self.gpios[num];
      if (gpio) gpio.setDirection(direction);
    });

    return this;
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
      Object.keys(self.gpios).forEach(function(num) {
        self.gpios[num].set(LOW);
      });
      hc.send(res);
    });

    return this;
  }

});
