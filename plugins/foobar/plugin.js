var Controller = require("node-controller");

var PluginController = Controller.extend({
    init: function(parent) {
        this._super(parent);
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


module.exports = PluginController;
