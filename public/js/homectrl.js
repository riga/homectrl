var HomeCtrl = Class.extend({
    init: function() {
        this.workflow = {
            activePlugin: null
        };

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
        var $link = $("#navlist")
            .append("<li><a href='#" + plugin.name + "'>" + plugin.label + "</a></li>")
            .children().last().children().first();

        // store data inside the plugin
        plugin._$link = $link;
        plugin._hash = "#" + plugin.name;

        return this;
    },

    onHashChange: function() {
        var hash = window.location.hash;
        if (hash)
            this.switchPlugin(hash.substr(1));
        return this;
    },

    switchPlugin: function(name) {
        var plugin = this.plugins[name];
        if (!plugin)
            return this;

        // toggle activity
        if (this.workflow.activePlugin)
            this.workflow.activePlugin._$link.parent().toggleClass("active", false);
        plugin._$link.parent().toggleClass("active", true);
        this.workflow.activePlugin = plugin;

        return this;
    },

    setupTopics: function() {
        $.Topic("plugin.register").subscribe(this.registerPlugin.bind(this));
        return this;
    }
});

window.hc = new HomeCtrl();
