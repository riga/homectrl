// load modules
var hc     = require("homectrl"),
    format = require("util").format,
    exec   = require("child_process").exec;


module.exports = exports = hc.Plugin._extend({

  // plugin method
  setup: function() {
    this.setup._super.call(this);

    // prepare the command
    this.cmd = format(
      "raspistill -t 500 -h %s -w %s -q %s -o %s/static/img/cam.png",
      this.config.get("height"),
      this.config.get("width"),
      this.config.get("quality"),
      this.root
    );

    // setup messages
    this.setupMessages();

    // log
    this.logger.info("cam: setup");
  },

  setupMessages: function() {
    var self = this;

    this.on("in.refresh", function(socketId) {
      exec(self.cmd, function() {
        self.emit("out.refresh", "all");
      });
    });

    return this;
  }

});
