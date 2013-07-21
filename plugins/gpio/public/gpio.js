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
            $("a[direction='in']").click(function() {
                self.addInput($(this).attr("pin"));
            });
        });

        return this;
    },

    addOutput: function(pin) {
        var self = this;

        var dfd = $.Deferred();
        if ($.inArray(pin, this.outputs) >= 0)
            dfd.reject();
        else if ($.inArray(pin, this.inputs) >= 0) {
            this.removeInput(pin).always(function() {
                self.addOutput(pin);
            });
        } else {
            // tell the server
            $.post(this.url("defineoutput"), {pin: pin}, function(response) {
                if (!response.success) {
                    alert("error");
                    dfd.reject();
                } else {
                    self.outputs.push(pin);
                    self.setLinkStatus("out", pin, false);
                    var id = "toggle-output-" + pin;
                    self.getTemplate("toggle.jade", {id: id, pin: pin}, function(tmpl) {
                        $("#output-info").hide();
                        $("#output-collection table").show();
                        $("#output-collection tbody").append(tmpl);
                        $("#"+id).bootstrapSwitch();
                        // connect the unset button
                        $("#"+id).parent().parent().find("button").click(function() {
                            self.removeOutput(pin);
                        });
                        // connect the toggle
                        $("#"+id).on("switch-change", function(e, data) {
                            $(e.target).bootstrapSwitch("setActive", false);
                            // tell the server
                            $.post(self.url("set"), {pin: pin, value: data.value}, function(response) {
                                $(e.target).bootstrapSwitch("setActive", true);
                                if (!response.success) {
                                    alert("error");
                                    $(e.target).bootstrapSwitch("setState", !data.value);
                                }
                            });
                        });
                    });
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
                    self.setLinkStatus("out", pin, true);
                    var id = "toggle-output-" + pin;
                    $("#"+id).parent().parent().remove();
                    if (!self.outputs.length) {
                        $("#output-collection table").hide();
                        $("#output-info").show();
                    }
                    dfd.resolve();
                }
            });
        }
        return dfd;
    },

    addInput: function(pin) {
        var self = this;

        var dfd = $.Deferred();
        if ($.inArray(pin, this.inputs) >= 0)
            dfd.reject();
        else if ($.inArray(pin, this.outputs) >= 0) {
            this.removeOutput(pin).always(function() {
                self.addInput(pin);
            });
        } else {
            // tell the server
            $.post(this.url("defineinput"), {pin: pin}, function(response) {
                if (!response.success) {
                    alert("error");
                    dfd.reject();
                } else {
                    self.inputs.push(pin);
                    self.setLinkStatus("in", pin, false);
                    var id = "label-input-" + pin;
                    var toggleId = "toggle-input-" + pin;
                    self.getTemplate("label.jade", {id: id, pin: pin, toggleId: toggleId}, function(tmpl) {
                        $("#input-info").hide();
                        $("#input-collection table").show();
                        $("#input-collection tbody").append(tmpl);
                        $("#"+toggleId).bootstrapSwitch();
                        // connect the unset button
                        $label = $("#"+id);
                        $label.parent().parent().find("button").click(function() {
                            self.removeInput(pin);
                        });
                        // connect the toggle
                        $("#"+toggleId).on("switch-change", function(e, data) {
                            $(e.target).bootstrapSwitch("setActive", false);
                            // tell the server
                            if (data.value)
                                $.post(self.url("listen"), {pin: pin, socketId: hc.socketId()}, function(response) {
                                    $(e.target).bootstrapSwitch("setActive", true);
                                    if (!response.success) {
                                        alert("error");
                                        $(e.target).bootstrapSwitch("setState", !data.value);
                                    } else {
                                        hc.websocket.on("gpio.input", function(data) {
                                            if (data.pin == pin)
                                                $("#"+id).html(data.value);
                                        });
                                    }
                                });
                            else
                                $.post(self.url("unlisten"), {pin: pin}, function(response) {
                                    $(e.target).bootstrapSwitch("setActive", true);
                                    if (!response.success) {
                                        alert("error");
                                        $(e.target).bootstrapSwitch("setState", !data.value);
                                    } else {
                                        $("#"+id).html("");
                                    }
                                });
                        });
                    });
                    dfd.resolve();
                }
            });
        }
        return dfd;
    },

    removeInput: function(pin) {
        var self = this;

        var dfd = $.Deferred();
        var idx = $.inArray(pin, this.inputs);
        if (idx < 0)
            dfd.reject();
        else {
            // tell the server
            $.post(this.url("unexport"), {pin: pin}, function(response) {
                if (!response.success) {
                    alert("error");
                    dfd.reject();
                } else {
                    self.inputs.splice(idx, 1);
                    self.setLinkStatus("in", pin, true);
                    var id = "label-input-" + pin;
                    $("#"+id).parent().parent().remove();
                    if (!self.inputs.length) {
                        $("#input-collection table").hide();
                        $("#input-info").show();
                    }
                    dfd.resolve();
                }
            });
        }
        return dfd;
    },

    setLinkStatus: function(direction, pin, status) {
        var $a = $("a[direction='" + direction + "'][pin='" + pin + "']");
        $a.parent().toggleClass("disabled", !status);
        return this;
    }

});

$.Topic("plugin.register").publish(new TestPlugin());
