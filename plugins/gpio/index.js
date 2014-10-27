var hc   = require("homectrl"),
    gpio = require("gpio");


module.exports = hc.Plugin._extend({

  setup: function() {
    this._super();

    // this.templateData["index.jade"] = { pins: this.config.get("pins") };
  }

});
