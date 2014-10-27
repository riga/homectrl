define(["homectrl"], function(hc) {

  var GPIOPlugin = hc.Plugin._extend({

    setup: function() {
      this._super();

      this.dirTogglesVisible = true;
      this.valueWaitCounter  = 0;

      this.addCss("styles.min.css");
      this.setLabel("GPIO");
      this.setIcon("heart");

      this.dirSwitchConfig = {
        onText  : "In",
        offText : "Out",
        onColor : "info",
        offColor: "info",
        size    : "small"
      };
      this.valueSwitchConfig = {
        onText  : "1",
        offText : "0",
        onColor : "success",
        offColor: "danger",
        readonly: false
      };

      this.nodes.gpios = {};

      this.setupUI();
    },

    setupUI: function() {
      var self = this;

      this.GET("/gpios", function(res) {
        self.getTemplate("index.jade", function(tmpl) {

          var directives = {
            gpio: {
              action: function(data) {
                $(data.element).attr("id", this.num);
              }
            }
          };

          // render
          self.nodes.$content.html(tmpl).find("#gpios").render(res.data, directives);
          self.nodes.$content.find(".direction input").bootstrapSwitch(self.dirSwitchConfig);
          self.nodes.$content.find(".value input").bootstrapSwitch(self.valueSwitchConfig);

          // store nodes
          self.nodes.$dirToggle = self.nodes.$content.find("#dir-toggle");
          self.nodes.$resetAll  = self.nodes.$content.find("#reset-all");

          // events
          self.nodes.$dirToggle.click(function(event) {
            self.toggleDirectionToggles();
          });

          self.nodes.$resetAll.click(function() {
            self.POST("/resetall");
          });

          // apply data from cookies
          var dirTogglesVisible = $.cookie("dirTogglesVisible") != "false";
          self.toggleDirectionToggles(dirTogglesVisible);

          // setup gpios
          self.setupGpios(res.data);
        });
      });
    },

    setupGpios: function(data) {
      var self = this;

      data.forEach(function(gpio) {
        var $gpio      = self.nodes.$content.find("#gpios > .gpio#" + gpio.num);
        var $value     = $gpio.find(".value input");
        var $direction = $gpio.find(".direction input");

        // set value and direction
        $value.bootstrapSwitch("state", gpio.value == 1, true);
        $direction.bootstrapSwitch("state", gpio.direction == "in", true);

        // events
        $value.on("switchChange.bootstrapSwitch", function(event, state) {
          $value.bootstrapSwitch("disabled", true);
          self.valueWaitCounter++;
          self.nodes.$resetAll.toggleClass("disabled", true);
          self.sendMessage("valueChange", gpio.num, state ? 1 : 0);
        });
        $direction.on("switchChange.bootstrapSwitch", function(event, state) {
          $direction.bootstrapSwitch("disabled", true);
          $value.bootstrapSwitch("disabled", true);
          self.sendMessage("directionChange", gpio.num, state ? "in" : "out");
        });

        // store nodes
        self.nodes.gpios[gpio.num] = {
          $gpio     : $gpio,
          $value    : $value,
          $direction: $direction
        };
      });

      return this;
    },

    onMessage: function(topic, num, value) {
      var nodes = this.nodes.gpios[num];
      if (!nodes) return this;

      if (topic == "valueChange") {
        nodes.$value.bootstrapSwitch("state", value == 1, true);
        nodes.$value.bootstrapSwitch("disabled", false);
        this.valueWaitCounter--;
        this.valueWaitCounter = Math.max(this.valueWaitCounter, 0);
        if (this.valueWaitCounter == 0) {
          this.nodes.$resetAll.toggleClass("disabled", false);
        }
      } else if (topic == "directionChange") {
        nodes.$direction.bootstrapSwitch("state", value == "in", true);
        nodes.$direction.bootstrapSwitch("disabled", false);
        nodes.$value.bootstrapSwitch("readonly", value == "in");
        nodes.$value.bootstrapSwitch("disabled", false);
      }

      return this;
    },

    toggleDirectionToggles: function(desired) {
      if (typeof desired == "boolean" && desired == this.dirTogglesVisible) {
        // no change => nothing happens
        return this;
      }

      this.dirTogglesVisible = !this.dirTogglesVisible;
      $.cookie("dirTogglesVisible", this.dirTogglesVisible);

      if (this.dirTogglesVisible) {
        this.nodes.$content.find(".direction").slideDown(200);
        this.nodes.$dirToggle.find("span").html(" Hide Directions");
        this.nodes.$dirToggle.find("i").attr("class", "glyphicon glyphicon-eye-close");
      } else {
        this.nodes.$content.find(".direction").slideUp(200);
        this.nodes.$dirToggle.find("span").html(" Show Directions");
        this.nodes.$dirToggle.find("i").attr("class", "glyphicon glyphicon-eye-open");
      }

      return this;
    }

  });

  return GPIOPlugin;
});
