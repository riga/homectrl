module.exports = Plugin.extend({
    init: function() {
        this._super.apply(this, arguments);
    },

    files: function() {
        return {
            js: ["script.js"],
            css: ["styles.css"]
        };
    },

    _index_: function(req, res) {
        res.send("Plugin test succeeded");
    }

});
