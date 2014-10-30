define(["homectrl"], function(hc) {

  return hc.Plugin._extend({

    setup: function() {
      this._super();

      var self = this;
      this.getTemplate("index.jade", function(tmpl) {
        self.nodes.$content.html(tmpl);
      };
    }

  });

});
