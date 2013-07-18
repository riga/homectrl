var Plugin = Class.extend({
    init: function() {
        this.name = null;

        this.label = null;
    },

    content: function() {
        throw "NotImplementedError";
    }
});

var TestPlugin = Plugin.extend({
    init: function() {
        this._super();

        this.name = "test";
        this.label = "Test";
    }

});

$.Topic("plugin.register").publish(new TestPlugin());
