var HomeCtrl = Class.extend({
    init: function() {
        this.workflow = {
            activePlugin: null
        };

        this.plugins = {};
        this.setupTopics();

        this.websocket = io.connect("http://" + wsHost + ":" + wsPort);

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

        // setup the content
        var wrapper = $("<div>").addClass("content-wrapper").appendTo("#content");
        plugin.setContent(wrapper);

        // store data inside the plugin
        plugin._$link = $link;
        plugin._hash = "#" + plugin.name;
        plugin._wrapper = wrapper;

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

        // toggle view and activity
        if (this.workflow.activePlugin) {
            this.workflow.activePlugin._$link.parent().toggleClass("active", false);
            this.workflow.activePlugin._wrapper.hide();
        }
        plugin._$link.parent().toggleClass("active", true);
        plugin._wrapper.show();
        this.workflow.activePlugin = plugin;

        return this;
    },

    setupTopics: function() {
        $.Topic("plugin.register").subscribe(this.registerPlugin.bind(this));
        return this;
    },

    socketId: function() {
        return this.websocket.socket.sessionid;
    },

    url: function(url) {
        return base + url;
    }
});

window.hc = new HomeCtrl();
