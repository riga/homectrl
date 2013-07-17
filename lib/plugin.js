var Controller = require("node-controller"),
    fs         = require("fs"),
    path       = require("path");

var Class = require("./class");

var PluginHandler = Class.extend({
    init: function(server) {
        this.server = server;

        // inspect the plugin folder
        fs.readdir(server.paths.plugins, function(err, names) {
            if (err)
                throw err;
            names.forEach(function(name) {
                var base = path.join(server.paths.plugins, name);

                // search for the plugin file
                var PluginController = require(path.join(base, "plugin.js"));
                if (!(PluginController instanceof Function))
                    return;
                var ctrl = new PluginController(server.root.plugin);
                if (!(ctrl instanceof Controller))
                    return;

                // add the controller to the server's plugin controller
                server.logger.log("info", "Start Plugin '%s'", name);
                server.root.plugin[name] = ctrl;
            });
        });
    }
});

var PluginController = Controller.extend({
    init: function(parent) {
        this._super(parent);
    },

    _index_: function(req, res) {
        res.send("");
    }
});


module.exports.handler = PluginHandler;
module.exports.controller = PluginController;
