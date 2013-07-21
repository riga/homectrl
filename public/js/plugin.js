var Plugin = Class.extend({
    init: function() {
        this.name = null;

        this.label = null;
    },

    setContent: function($node) {
        throw "NotImplementedError";
    },

    url: function(url) {
        return hc.url("plugins/" + this.name + "/" + url);
    },

    getTemplate: function(tmpl, callback) {
        $.post(this.url("template"), {tmpl: tmpl}, callback);
        return this;
    }
});
