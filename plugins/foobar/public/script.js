var Plugin = Class.extend({
    init: function() {
        this.name = null;

        this.label = null;
    },

    content: function() {
        throw "NotImplementedError";
    }
});

var FooBarPlugin = Plugin.extend({
    init: function() {
        this._super();

        this.name = "foobar";
        this.label = "FooBar";
    }

});

$.Topic("plugin.register").publish(new FooBarPlugin());
