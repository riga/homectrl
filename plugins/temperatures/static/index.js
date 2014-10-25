define(["homectrl"], function(hc) {

  var TemperaturesPlugin = hc.Plugin._extend({

    setup: function() {
      this._super();

      var self = this;

      this.setLabel("Temperatures");
      this.setIcon("fire");

      this.getTemplate("index.jade", function(tmpl) {
        self.nodes.$content.html(tmpl);
      });
    }

  });

  return TemperaturesPlugin;
});
