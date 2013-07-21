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

    getTemplate: function(tmpl, data, callback) {
        if (callback === undefined && data instanceof Function) {
            callback = data;
            data = null;
        }
        $.post(this.url("template"), $.extend({tmpl: tmpl}, data), callback);
        return this;
    }
});
