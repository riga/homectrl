define(["homectrl", "jquery"], function(hc, $) {

  return hc.Plugin._extend({

    // plugin method
    setup: function() {
      this.setup._super.call(this);

      this.addCss("styles.min.css");
      this.setLabel("Cam");
      this.setIcon("camera");

      this.setupUI();
    },

    setupUI: function() {
      var self = this;

      // load the index template
      this.getTemplate("index.jade", function(tmpl) {
        self.nodes.$content.html(tmpl);

        // events
        self.nodes.$content.find("#play").click(function(event) {
          var $stream = self.nodes.$content.find("#stream");
          $stream.html($stream.html());
        });
      });
    }

  });

});
