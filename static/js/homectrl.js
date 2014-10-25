define(["jquery", "io", "emitter"], function($, io, Emitter) {

  var HomeCtrl, Plugin, homectrl;

  HomeCtrl = Emitter._extend({

    init: function() {
      this._super();

      this.nodes   = {};
      this.socket  = null;
      this.plugins = {};

      this.deviceMode      = null;
      this.menuOpen        = false;
      this.currentViewName = null;

      this.pluginNames = window._tmplData.plugins;
    },

    setup: function() {
      var self = this;

      this.setupUI();
      this.setupSocket(function() {
        self.setupPlugins(function() {
          self.applyHash();
        });
      });

      return this;
    },

    setupUI: function() {
      var self = this;

      // store nodes
      this.nodes.$main         = $("#homectrl");
      this.nodes.$blocker      = $("#blocker");
      this.nodes.$menuToggle   = $("#menu-toggle");
      this.nodes.$menuItemHook = $("#menu-item-hook");

      // functionality to change the mode, i.e. "desktop" or "mobile"
      var updateMode = function() {
        var width    = $(window).width();

        var isMobile = width <= 1000; // TODO: define breakpoint somewhere else
        var mode     = isMobile ? "mobile" : "desktop";

        if (mode != self.deviceMode) {
          self.deviceMode = mode;
          self.nodes.$main.toggleClass("desktop", !isMobile).toggleClass("mobile", isMobile);
        }
      };
      $(window).resize(updateMode);
      updateMode();

      // react to hash changes
      $(window).on("hashchange", this.applyHash.bind(this));

      // bind events
      this.nodes.$menuToggle.click(function(event) {
        event.preventDefault();
        self.toggleMenu();
      });

      this.nodes.$blocker.click(function(event) {
        event.preventDefault();
        self.toggleMenu(false);
      });

      $("#menu > ul > li > a").click(function(event) {
        self.toggleMenu(false);
      });

      // hide the splashscreen
      $("#splashscreen").hide();

      return this;
    },

    setupSocket: function(callback) {
      var self = this;

      var socketPath = window._tmplData.root + "socket.io";
      var socketHost = window.location.protocol + "//" + window.location.hostname + ":"
                     + window._tmplData.ioPort;

      this.socket = io.connect(socketHost, { path: socketPath });

      this.socket.on("message.plugin", function(pluginName, topic) {
        var p = self.getPlugin(pluginName);
        if (!(p instanceof Plugin)) return;

        var args = Array.prototype.slice.call(arguments, 2);
        args.unshift(topic);

        p.onMessage.apply(p, args);
      });

      this.socket.on("id", function(id) {
        $.cookie("socketId", id);
      });

      this.socket.on("connect", callback || function(){});

      return this;
    },

    setupPlugins: function(callback) {
      var self = this;

      var menuItemTmpl = "<li><a><i></i> <span></span></a></li>";
      var contentTmpl  = "<div class='plugin'></div>";

      // create plugin modules and require them
      var pluginModules = this.pluginNames.map(function(name) {
        return "plugin/" + name + "/static/index";
      });

      require(pluginModules, function() {
        Array.prototype.slice.call(arguments).forEach(function(Cls, i) {
          var name = self.pluginNames[i];

          if (!Cls._extends || !Cls._extends(Plugin)) {
            console.error("plugin '%s' does not return a homectrl.Plugin", name);
            return;
          };

          var p = new Cls(name);
          self.plugins[name] = p;

          // setup the content node
          p.nodes.$content = $(contentTmpl)
            .appendTo($("#content"))
            .attr("id", name);

          // add the menu item before the divider and store nodes
          var $menuItem = $(menuItemTmpl).insertBefore(self.nodes.$menuItemHook);
          p.nodes.$menuItemLabel = $menuItem.find("a > span");
          p.nodes.$menuItemIcon  = $menuItem.find("a > i");

          // menu event
          $menuItem.find("a").click(function(event) {
            self.toggleMenu(false);
          });

          // manipulate the menu item
          $menuItem.find("a").attr("href", "#" + name);
          p.setLabel(name);
          p.setIcon("chevron-right");

          p.setup();
        });

        (callback || function(){})();
      });

      return this;
    },

    getPlugin: function(name) {
      return this.plugins[name] || null;
    },

    applyHash: function() {
      var hash = window.location.hash.substr(1);
      if (!hash) {
        if (this.pluginNames.length) hash = this.pluginNames[0];
        else return this;
      }

      this.showView(hash);

      return this;
    },

    showView: function(viewName) {
      if (!viewName || viewName == this.currentViewName) return this;

      this.hideCurrentView();

      var selector = "#" + viewName;

      // a plugin?
      if (~this.pluginNames.indexOf(viewName)) {
        var p = this.getPlugin(viewName);
        if (p instanceof Plugin) p.onShow();
        selector += ".plugin";
      }

      $(selector).show();
      this.currentViewName = viewName;

      return this;
    },

    hideCurrentView: function() {
      if (!this.currentViewName) return this;

      var selector = "#" + this.currentViewName;

      // a plugin?
      if (~this.pluginNames.indexOf(this.currentViewName)) {
        var p = this.getPlugin(this.currentViewName);
        if (p instanceof Plugin) p.onHide();
        selector += ".plugin";
      }

      $(selector).hide();
      this.currentViewName = null;

      return this;
    },

    toggleMenu: function(desired) {
      if (typeof desired == "boolean" && desired == this.menuOpen) {
        // no change => nothing happens
        return this;
      }

      this.menuOpen = !this.menuOpen;
      this.nodes.$main.toggleClass("menu-open", this.menuOpen);

      return this;
    }
  });


  Plugin = Emitter._extend({

    init: function(name) {
      this._super();

      this.name  = name;

      this.label = name;
      this.nodes = {
        $content      : null,
        $menuItemLabel: null,
        $menuItemIcon : null
      };
    },

    setup: function() {
      return this;
    },

    setLabel: function(label) {
      this.label = label;
      if (this.nodes.$menuItemLabel) {
        this.nodes.$menuItemLabel.html(label);
      }
      return this;
    },

    setIcon: function(iconClass) {
      if (!/^glyphicon\ glyphicon\-/.test(iconClass)) {
        iconClass = "glyphicon glyphicon-" + iconClass;
      }
      if (this.nodes.$menuItemIcon) {
        this.nodes.$menuItemIcon.attr("class", iconClass);
      }
      return this;
    },

    _resolve: function(method, path) {
      var args = Array.prototype.slice.call(arguments, 2);
      if (path.substr(0, 1) == "/") {
        path = path.substr(1);
      }
      path = window._tmplData.root + "plugins/" + this.name + "/" + path;
      args.unshift(path);
      return $[method].apply($, args);
    },

    GET: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift("get");
      return this._resolve.apply(this, args);
    },

    POST: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift("post");
      return this._resolve.apply(this, args);
    },

    getTemplate: function(path, data) {
      var args = Array.prototype.slice.call(arguments, 2);
      if (typeof data === "function") {
        args.unshift(data);
        data = null;
      }
      args = ["template", { path: path, data: data || {} }].concat(args);
      return this.GET.apply(this, args);
    },

    onShow: function() {
      return this;
    },

    onHide: function() {
      return this;
    },

    onMessage: function(topic) {
      return this;
    },

    sendMessage: function(topic) {
      var args = Array.prototype.slice.call(arguments, 1);
      args = ["message.plugin", this.name, topic].concat(args);
      homectrl.socket.emit.apply(homectrl.socket, args);
      return this;
    }
  });


  homectrl = new HomeCtrl();
  homectrl.setup();


  return {
    homectrl: homectrl,
    Plugin  : Plugin
  }
});
