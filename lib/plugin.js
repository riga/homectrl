var Controller = require("node-controller"),
    fs         = require("fs"),
    path       = require("path"),
    express    = require("express");

var Class = require("./class");

var PluginHandler = Class.extend({
    init: function(server) {
        var self = this;
        this.server = server;

        this.plugins = {};
        this.files = {
            js: [],
            css: []
        };

        // inspect the plugin folder
        var names = fs.readdirSync(server.paths.plugins);
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
            server.root.plugins[name] = ctrl;
            self.plugins[name] = ctrl;

            // static mount
            var mount = path.join(server.config.get("server:base"), "plugins", name, "static");
            server.app.use(mount, express.static(path.join(base, "public")));

            // collect files
            var fill = function(source, target) {
                source.forEach(function(file) {
                    file = path.join(server.config.get("server:base"), "plugins", name, "static", file);
                    target.push(file);
                });
            };
            var files = ctrl.files() || {};
            if (files.js instanceof Array)
                fill(files.js, self.files.js);
            if (files.css instanceof Array)
                fill(files.css, self.files.css);
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
