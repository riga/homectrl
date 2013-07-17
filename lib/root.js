var util       = require("util"),
    Controller = require("node-controller");

var PluginController = require("./plugin").controller;

var RootController = Controller.extend({
    init: function(parent) {
        this._super(parent);

        this.plugin = new PluginController(this);
    },

    _index_: function(req, res) {
        res.send("Hello World!!");
    }

});


module.exports = RootController;