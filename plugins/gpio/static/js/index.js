define(["homectrl"], function(hc) {

  var GPIOPlugin = hc.Plugin._extend({

    setup: function() {
      this._super();

      var self = this;

      this.addCss("styles.min.css");
      this.setLabel("GPIO");
      this.setIcon("heart");

      this.getTemplate("index.jade", function(tmpl) {
        self.nodes.$content.html(tmpl)
          .find("input").bootstrapSwitch();
      });
    }

  });

  return GPIOPlugin;
});
