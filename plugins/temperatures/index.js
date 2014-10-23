// temperatures/index.js

var hc = require("homectrl");


module.exports = hc.Plugin._extend({

  setup: function() {
    console.log("setup called of temperatures plugin");

    this.GET("/", function(req, res) {
      // hc.send(res);
      res.render("index.jade");
    });
  }
});