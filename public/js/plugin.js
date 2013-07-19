var Plugin = Class.extend({
    init: function() {
        this.name = null;

        this.label = null;
    },

    setContent: function($node) {
        throw "NotImplementedError";
    },

    getTemplate: function(tmpl, callback) {
        $.post(hc.url("plugins/" + this.name + "/template"), {tmpl: tmpl}, callback);
        return this;
    }
});
