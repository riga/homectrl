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
      this.nodes.switches = [];
      this.GET("/switches", function(res) {
        self.setupUI(res.data, function(err) {
          self.setupMessages();
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
        self.nodes.$content.find(".state input").bootstrapSwitch({
          onText  : "On",
          offText : "Off",
          onColor : "success",
          offColor: "danger",
          readonly: false
        });

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
        var $switch = self.nodes.$content.find("#switches > .switch#" + i);
        var $state  = $switch.find(".state input");

        // apply the state
        $state.bootstrapSwitch("state", _switch.state, true);

        // bind switch events
        $state.on("switchChange.bootstrapSwitch", function(event, state) {
          $state.bootstrapSwitch("disabled", true);
          self.emit("out.stateChange", i, state);
        });

        // store nodes
        self.nodes.switches[i] = {
          $switch : $switch,
          $state  : $state
        };
      });

      return this;
    },

    // custom method
    setupMessages: function() {
      var self = this;

      this.on("in.stateChange", function(i, state) {
        var nodes = self.nodes.switches[i];
        if (!nodes) return;

        // update the switch state and disabled state
        nodes.$state.bootstrapSwitch("state", state, true);
        nodes.$state.bootstrapSwitch("disabled", false);
      });

      return this;
    }

  });

});
