var CamPlugin = Plugin.extend({
    init: function() {
        this._super();

        this.name = "cam";
        this.label = "Cam";

        //this.bindSocket();
    },

    setContent: function($node) {
        var self = this;

        this.getTemplate("main.jade", function(tmpl) {
            $node.append(tmpl);

            // $("#cam-switch").bootstrapSwitch().on("switch-change", function(e, data) {
            //     if (data.value)
            //         $.post(self.url("listen"), {socketId: hc.socketId()});
            //     else
            //         $.post(self.url("unlisten"), {socketId: hc.socketId()});
            // });

            $("#cam-refresh").click(function() {
                $("#cam-video").html($("#cam-video").html());
            });
        });

        return this;
    },

    bindSocket: function() {
        var data = "";
        hc.websocket.on("cam.chunk", function(chunk) {
            data += chunk;
        });
        hc.websocket.on("cam.complete", function() {
            var img = data;
            data = "";
            $("#cam-img").attr("src", "data:image/jpg;base64," + img);
        });
    }
});

$.Topic("plugin.register").publish(new CamPlugin());
