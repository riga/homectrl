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
            // valid plugin folders must not start with an underscore "_"
            if (name[0] == "_")
                return;

            // create the plugin's base path
            var base = path.join(server.paths.plugins, name);

            // search for the plugin file
            var Plugin = require(path.join(base, "plugin.js"));
            if (!(Plugin instanceof Function))
                return;

            var ctrl = new Plugin(server.root.plugins, name);
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
                    file = path.join("plugins", name, "static", file);
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
    }
});

var BasePlugin = Controller.extend({
    init: function(parent, name) {
        this._super(parent);

        this.server = this.findRoot();
        this.name = name;
        this.paths = {
            base: path.join(this.server.paths.plugins, name),
            views: path.join(this.server.paths.plugins, name, "views"),
            config: path.join(this.server.paths.plugins, name, "config")
        };
    },

    files: function() {
        throw "NotImplementedError";
    },

    socket: function() {
        return this.server.socketHandler.getSocket.apply(this.server.socketHandler, arguments);
    },

    _template_: function(req, res) {
        var tmpl = path.join(this.paths.views, req.body.tmpl);
        res.render(tmpl, req.body);
    }
});


module.exports.handler = PluginHandler;
module.exports.controller = PluginController;
global.Plugin = BasePlugin;
global.Class = Class;
