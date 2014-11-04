// load modules
var hc    = require("homectrl"),
    GPIO  = require("gpio");


// define some constants derived from the gpio module
var IN   = "in",
    OUT  = "out",
    HIGH = 1,
    LOW  = 0;


// create and export our own server-side plugin class by extending hc.Plugin
module.exports = hc.Plugin._extend({

  setup: function() {
    this.setup._super.call(this);

    // setup gpios, based on the config file (read automatically)
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
        // bind the valueChange event to ourself
        gpio.on("valueChange", function(value) {
          self.emit("out.valueChange", "all", num, value);
        });

        // bind the directionChange event to ourself
        gpio.on("directionChange", function(direction) {
          self.emit("out.directionChange", "all", num, direction);
          if (direction == OUT) gpio.set(LOW);
        });

        // initially, set the gpio LOW
        gpio.set(LOW);
      }
    });

    return this;
  },

  setupMessages: function() {
    var self = this;

    // dipatch incomming valueChange messages
    this.on("in.valueChange", function(socketId, num, value) {
      var gpio = self.gpios[num];
      if (gpio) gpio.set(value);
    });

    // dispatch incomming directionChange messages
    this.on("in.directionChange", function(socketId, num, direction) {
      var gpio = self.gpios[num];
      if (gpio) gpio.setDirection(direction);
    });

    return this;
  },

  setupRoutes: function() {
    var self = this;

    this.GET("/gpios", function(req, res) {
      // send a list of objects containing gpio data: num, value and direction

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
      // set all gpios LOW, the bound events will do the rest

      Object.keys(self.gpios).forEach(function(num) {
        self.gpios[num].set(LOW);
      });

      hc.send(res);
    });

    return this;
  }

});
