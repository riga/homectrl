var util       = require("util"),
    Controller = require("node-controller");

var PluginController = require("./plugin").controller;

var RootController = Controller.extend({
    init: function(parent) {
        this._super(parent);
        this.plugins = new PluginController(this);

        this.user = {
            name: parent.config.get("user:name"),
            pass: parent.config.get("user:pass")
        };
    },

    _index_: function(req, res) {
        var tmplData = {
            base: this.parent.config.get("server:base"),
            wsHost: this.parent.config.get("websocket:host"),
            wsPort: this.parent.config.get("websocket:port"),
            jsFiles: this.parent.pluginHandler.files.js,
            cssFiles: this.parent.pluginHandler.files.css
        }
        res.render("index.jade", tmplData);
    },

    _login_: function(req, res) {
        res.render("login.jade", {base: this.parent.config.get("server:base")});
    },

    _logout_: function(req, res) {
        delete req.session.auth;
        res.redirect(this.parent.config.get("server:base"));
    },

    _loginajax_: function(req, res) {
        var success = req.body.login == this.user.name && req.body.pass == this.user.pass;
        req.session.auth = success;
        res.send({success: success});
    }

});


module.exports = RootController;
