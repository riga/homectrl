var TestPlugin = Plugin.extend({
    init: function() {
        this._super();

        this.name = "dummy";
        this.label = "Dummy";
    },

    setContent: function($node) {
        this.getTemplate("dummy.jade", function(tmpl) {
            $node.append(tmpl);
        });
        return this;
    }

});

$.Topic("plugin.register").publish(new TestPlugin());
