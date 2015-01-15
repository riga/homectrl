define(["homectrl", "jquery"], function(hc, $) {

  // define and return our plugin
  return hc.Plugin._extend({

    // plugin method
    // invoked when all components of this plugin are set up
    setup: function() {
      this.setup._super.call(this);

      var self = this;

      // add our css file, set the label and bootstrap icon class
      this.addCss("styles.min.css");
      this.setLabel("Sockets");
      this.setIcon("flash");

      // load switch data and start
      this.GET("/switches", function(res) {
        self.setupUI(res.data, function(err) {
          self.setupSwitches(res.data);
        });
      });
    },

    setupUI: function(data, callback) {
      var self = this;

      // load the template
      this.getTemplate("index.jade", function(tmpl) {
        var directives = {
          "switch": {
            action: function(data) {
              $(data.element).attr("id", data.index);
            }
          }
        };

        // render and setup the bootstrap switches
        self.nodes.$content.html(tmpl).find("#switches").render(data, directives);

        // store nodes
        self.nodes.$allOn  = self.nodes.$content.find("#all-on");
        self.nodes.$allOff = self.nodes.$content.find("#all-off");

        // events
        self.nodes.$allOn.click(function() {
          self.POST("/allon");
        });
        self.nodes.$allOff.click(function() {
          self.POST("/alloff");
        });

        (callback || function(){})(null);
      });

      return this;
    },

    setupSwitches: function(data) {
      var self = this;

      data.forEach(function(_switch, i) {
        var $on  = self.nodes.$content.find("#switches > .switch#" + i + " #on");
        var $off = self.nodes.$content.find("#switches > .switch#" + i + " #off");

        // bind switch events
        $on.click(function() {
          self.emit("out.stateChange", i, true);
        });
        $off.click(function() {
          self.emit("out.stateChange", i, false);
        });
      });

      return this;
    }

  });

});
