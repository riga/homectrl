var hc = require("homectrl");

module.exports = hc.Plugin._extend({

  setup: function() {
    this._super();

    this.logger.info("{{name}}: setup");
  }

});
