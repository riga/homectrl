var TestPlugin = Plugin.extend({
    init: function() {
        this._super();

        this.name = "gpio";
        this.label = "GPIO";

        this.outputs = [];
        this.inputs = [];
    },

    setContent: function($node) {
        var self = this;

        this.getTemplate("main.jade", function(tmpl) {
            $node.append(tmpl);
            $("a[direction='out']").click(function() {
                self.addOutput($(this).attr("pin"));
            });
        });

        return this;
    },

    addOutput: function(pin) {
        var self = this;

        var dfd = $.Deferred();
        if ($.inArray(pin, this.outputs) >= 0)
            dfd.reject();
        else {
            // tell the server
            $.post(this.url("defineoutput"), {pin: pin}, function(response) {
                if (!response.success) {
                    alert("error");
                    dfd.reject();
                } else {
                    self.outputs.push(pin);
                    // TODO: update the view
                    console.log("added", pin);
                    dfd.resolve();
                }
            });
        }
        return dfd;
    },

    removeOutput: function(pin) {
        var self = this;

        var dfd = $.Deferred();
        var idx = $.inArray(pin, this.outputs);
        if (idx < 0)
            dfd.reject();
        else {
            // tell the server
            $.post(this.url("unexport"), {pin: pin}, function(response) {
                if (!response.success) {
                    alert("error");
                    dfd.reject();
                } else {
                    self.outputs.splice(idx, 1);
                    // TODO: update the view
                    console.log("removed", pin);
                    dfd.resolve();
                }
            });
        }
        return dfd;
    }

});

$.Topic("plugin.register").publish(new TestPlugin());
