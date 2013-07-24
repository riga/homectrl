var CamPlugin = Plugin.extend({
    init: function() {
        this._super();

        this.name = "cam";
        this.label = "Cam";
    },

    setContent: function($node) {
        this.getTemplate("main.jade", function(tmpl) {
            $node.append(tmpl);

            // refresh button action
            $("#cam-refresh").click(function() {
                $("#cam-video").html($("#cam-video").html());
            });
        });

        return this;
    }
});

$.Topic("plugin.register").publish(new CamPlugin());
