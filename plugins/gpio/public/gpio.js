var TestPlugin = Plugin.extend({
    init: function() {
        this._super();

        this.name = "gpio";
        this.label = "GPIO";
    },

    setContent: function($node) {
        this.getTemplate("main.jade", function(tmpl) {
            $node.append(tmpl);
        });
        return this;
    }

});

$.Topic("plugin.register").publish(new TestPlugin());
