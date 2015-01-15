// load modules
var hc     = require("homectrl"),
    format = require("util").format,
    exec   = require("child_process").exec,
    fs     = require("fs");


module.exports = exports = hc.Plugin._extend({

  // plugin method
  setup: function() {
    this.setup._super.call(this);

    // the streaming command
    // duration, height, width
    this.cmd = format(
      "raspivid -t %s -h %s -w %s -pf baseline -o - | ffmpeg -i - -vcodec copy -f mp4 -movflags faststart -map 0 -frag_size 1000 -v 10 - > %s",
      this.config.get("duration"),
      this.config.get("height"),
      this.config.get("width")
    );

    // set template data
    this.templateData["index.jade"] = {
      height: this.config.get("height"),
      width : this.config.get("width")
    };

    // setup the routes
    this.setupRoutes();

    // log
    this.logger.info("cam: setup");
  },

  setupRoutes: function() {
    var self = this;

    this.GET("/stream", function(req, res) {
      self.makeFifo(function(fifo) {
        res.set("Content-Type", "video/mp4");
        res.set("Content-Disposition", "inline;");

        var p = exec(format(self.cmd, fifo));
        var rs = fs.createReadStream(fifo);
        rs.pipe(res);
        rs.on("end", function() {
          p.kill();
          res.end();
        });
      });
    });

    return this;
  },

  makeFifo: function(callback) {
    var fifo = format("/tmp/fifo_%s", parseInt(Math.random() * 1000));
    exec("mkfifo " + fifo).on("exit", function() {
      (callback || function(){})(fifo);
    });
    return this;
  }

});
