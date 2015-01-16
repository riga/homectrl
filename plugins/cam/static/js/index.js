define(["homectrl", "jquery"], function(hc, $) {

  return hc.Plugin._extend({

    // plugin method
    setup: function() {
      this.setup._super.call(this);

      var self = this;

      this.addCss("styles.min.css");
      this.setLabel("Cam");
      this.setIcon("camera");

      this.setupUI(function(err) {
        self.setupMessages();
        self.emit("out.refresh");
      });
    },

    setupUI: function(callback) {
      var self = this;

      // load the index template
      this.getTemplate("index.jade", function(tmpl) {
        self.nodes.$content.html(tmpl);

        // store nodes
        self.nodes.$img     = self.nodes.$content.find("#image img");
        self.nodes.$refresh = self.nodes.$content.find("#refresh");

        // events
        self.nodes.$refresh.click(function(event) {
          self.emit("out.refresh");
        });

        (callback || function(){})(null);
      });

      return this;
    },

    setupMessages: function() {
      var self = this;

      this.on("in.refresh", function() {
        var t = (new Date()).getTime();
        self.nodes.$img.attr("src", self.staticRoot + "/img/cam.png?t=" + t);
      });

      return this;
    }

  });

});
