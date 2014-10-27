define(["homectrl"], function(hc) {

  var GPIOPlugin = hc.Plugin._extend({

    setup: function() {
      this._super();

      this.dirTogglesVisible = true;

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
          self.nodes.$content.find(".direction > input").bootstrapSwitch(self.dirSwitchConfig);
          self.nodes.$content.find(".value > input").bootstrapSwitch(self.valueSwitchConfig);

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
        });
      });
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
