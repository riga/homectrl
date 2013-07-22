var CamPlugin = Plugin.extend({
    init: function() {
        this._super();

        this.name = "cam";
        this.label = "Cam";

        hc.websocket.on("cam.img", function(data) {
            $("#img").attr("src", "data:image/jpg;base64," + data)
        });
    },

    setContent: function($node) {
        var self = this;

        this.getTemplate("main.jade", function(tmpl) {
            $node.append(tmpl);
            $("#cam-switch").bootstrapSwitch().on("switch-change", function(e, data) {
                if (data.value)
                    $.post(self.url("listen"), {socketId: hc.socketId()});
                else
                    $.post(self.url("unlisten"), {socketId: hc.socketId()});
            });
            
        });

        return this;
    }
});

$.Topic("plugin.register").publish(new CamPlugin());
