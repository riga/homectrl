var util       = require("util"),
    Controller = require("node-controller");

var PluginController = require("./plugin").controller;

var RootController = Controller.extend({
    init: function(parent) {
        this._super(parent);

        this.plugins = new PluginController(this);
    },

    _index_: function(req, res) {
        var tmplData = {
            base: this.parent.config.get("server:base"),
            jsFiles: this.parent.pluginHandler.files.js,
            cssFiles: this.parent.pluginHandler.files.css
        };
        res.render("index.jade", tmplData);
    }

});


module.exports = RootController;
