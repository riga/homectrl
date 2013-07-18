var HomeCtrl = Class.extend({
    init: function() {
        this.plugins = {};
        this.setupTopics();

        // register the onpopstate callback
        window.onpopstate = this.onHashChange.bind(this);
    },

    registerPlugin: function(plugin) {
        var self = this;

        // store the plugin
        this.plugins[plugin.name] = plugin;

        var nav = $("#navlist");

        // separator?
        if (nav.children().length)
            nav.append("<li class='divider-vertical'></li>");

        // add a link
        var link = $("#navlist")
            .append("<li><a href='#" + plugin.name + "'>" + plugin.label + "</a></li>")
            .children().last().children().first();

        return this;
    },

    onHashChange: function() {
        var hash = window.location.hash;
        if (hash)
            this.switchPlugin(hash.substr(1));
        return this;
    },

    switchPlugin: function(name) {
        console.log("switch to", name);
        return this;
    },

    setupTopics: function() {
        $.Topic("plugin.register").subscribe(this.registerPlugin.bind(this));
        return this;
    }
});

window.hc = new HomeCtrl();
