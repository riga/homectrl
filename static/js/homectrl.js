define(["jquery", "io", "emitter", "jqTransparency"], function($, io, Emitter, Transparency) {

  var HomeCtrl, Plugin, homectrl;


  // the global HomeCtrl class
  HomeCtrl = Emitter._extend({

    init: function() {
      this.init._super.call(this);

      this.nodes   = {};
      this.socket  = null;
      this.plugins = {};

      // state variables
      this.menuOpen        = false;
      this.currentViewName = null;

      // store the pluginNames given in the template data
      this.pluginNames = window._hcData.plugins;
    },

    setup: function() {
      var self = this;

      this.setupUI();
      this.setupSocket(function() {
        self.setupPlugins(function() {
          // initially, apply the first hash
          self.applyHash();
        });
      });

      return this;
    },

    setupUI: function() {
      var self = this;

      // only use data-bind attributes for transparency rendering
      Transparency.matcher = function(element, key) {
        return element.el.getAttribute("data-bind") == key;
      };

      // store nodes
      this.nodes.$main         = $("#homectrl").first();
      this.nodes.$menu         = this.nodes.$main.find("#menu").first();
      this.nodes.$menuItemHook = this.nodes.$menu.find("#menu-item-hook").first();
      this.nodes.$menuToggle   = this.nodes.$main.find("#page > #header #menu-toggle").first();
      this.nodes.$reload       = this.nodes.$main.find("#page > #header #reload").first();
      this.nodes.$content      = this.nodes.$main.find("#page > #content").first();
      this.nodes.$blocker      = this.nodes.$main.find("#page > #blocker").first();
      this.nodes.$titleHook    = this.nodes.$main.find("#page > #header #title-hook").first();

      // react to hash changes
      $(window).on("hashchange", this.applyHash.bind(this));

      // bind events
      this.nodes.$menuToggle.click(function(event) {
        self.toggleMenu();
      });
      this.nodes.$reload.click(function(event) {
        window.location.reload();
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

      // create host and path, then connect
      var socketHost = window.location.protocol + "//" + window.location.hostname + ":"
                     + window._hcData.ioPort;
      var socketPath = window._hcData.root + "socket.io";
      this.socket    = io.connect(socketHost, { path: socketPath });

      // store the socketId in a cookie so that it is send in ech http request
      this.socket.on("id", function(id) {
        $.cookie("socketId", id);
      });

      // handle incomming plugin messages
      this.socket.on("message.plugin", function(pluginName, topic) {
        var p = self.getPlugin(pluginName);
        if (!(p instanceof Plugin)) return;

        // prepend "in.<topic>" to mark the message as incomming
        var args = Array.prototype.slice.call(arguments, 2);
        args.unshift("in." + topic);

        p.emit.apply(p, args);
      });

      this.socket.on("connect", callback || function(){});

      return this;
    },

    setupPlugins: function(callback) {
      var self = this;

      // html templates
      var menuItemTmpl = "<li class='plugin'><a><i></i> <span></span></a></li>";
      var contentTmpl  = "<div class='plugin'></div>";
      var titleTmpl    = "<span class='plugin'><i></i> <span></span></span>";

      // create plugin modules and require them
      var pluginModules = this.pluginNames.map(function(name) {
        return "plugins/" + name + "/index";
      });

      // require plugins in parallel
      require(pluginModules, function() {
        Array.prototype.slice.call(arguments).forEach(function(Cls, i) {
          var name = self.pluginNames[i];

          if (!Cls._extends || !Cls._extends(Plugin)) {
            console.error("plugin '%s' does not return a homectrl.Plugin", name);
            return;
          };

          // create a new instance of the class and store it
          var p = new Cls(name);
          self.plugins[name] = p;

          // setup the content node
          p.nodes.$content = $(contentTmpl)
            .appendTo($("#content"))
            .attr("id", name);

          // add the menu item before the divider and store nodes
          p.nodes.$menuItem = $(menuItemTmpl)
            .insertBefore(self.nodes.$menuItemHook)
            .attr("id", name);
          p.nodes.$menuItemLabel = p.nodes.$menuItem.find("a > span");
          p.nodes.$menuItemIcon  = p.nodes.$menuItem.find("a > i");

          // title node
          p.nodes.$title = $(titleTmpl)
            .appendTo(self.nodes.$titleHook)
            .attr("id", name);

          // menu event
          p.nodes.$menuItem.find("a").click(function(event) {
            self.toggleMenu(false);
          });

          // manipulate the menu item
          p.nodes.$menuItem.find("a").attr("href", "#" + name);
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
      // takes the hash from the url and updates the view
      var hash = window.location.hash.substr(1);
      if (!hash) {
        if (this.pluginNames.length) hash = this.pluginNames[0];
        else return this;
      }

      this.showView(hash);

      return this;
    },

    showView: function(viewName) {
      // do nothing when there's no view change
      if (!viewName || viewName == this.currentViewName) return this;

      this.hideCurrentView();

      var selector = "#" + viewName;

      // a plugin?
      if (~this.pluginNames.indexOf(viewName)) {
        var p = this.getPlugin(viewName);
        if (!(p instanceof Plugin)) return this;
        p.onShow();
        selector += ".plugin#" + viewName;
      }

      // show content, update menu entry and title
      this.nodes.$content.find(selector).show();
      this.nodes.$menu.find(selector).toggleClass("active", true);
      this.nodes.$titleHook.find(selector).show();

      // update the global title tag
      $("head > title").html("homectrl - " + viewName);

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

      // hide content, update meny entry and title
      this.nodes.$content.find(selector).hide();
      this.nodes.$menu.find(selector).toggleClass("active", false);
      this.nodes.$titleHook.find(selector).hide();

      // update the global title tag
      $("head > title").html("homectrl");

      this.currentViewName = null;

      return this;
    },

    toggleMenu: function(desired) {
      if (typeof desired == "boolean" && desired == this.menuOpen) {
        // no change => nothing happens
        return this;
      }

      this.menuOpen = !this.menuOpen;

      // simply add or remove the menu-open class,
      // all style changes are css-based
      this.nodes.$main.toggleClass("menu-open", this.menuOpen);

      return this;
    }
  });


  // the client-side Plugin class that should be extended by plugins
  Plugin = Emitter._extend({

    init: function(name) {
      this.init._super.call(this, { wildcard: true });

      var self = this;

      this.name  = name;

      this.label     = null;
      this.iconClass = null;

      this.nodes = {
        $content      : null,
        $menuItem     : null,
        $menuItemLabel: null,
        $menuItemIcon : null,
        $title        : null
      };

      // catch and adjust emitted outgoing messages
      this.on("out.*", function() {
        var args  = Array.prototype.slice.call(arguments);
        var event = this.event.split(".");

        args = ["message.plugin", self.name, event[1]].concat(args);

        homectrl.socket.emit.apply(homectrl.socket, args);
      });
    },

    setup: function() {
      // initially, use the name as our label and an empty icon class
      this.setLabel(this.name);
      this.setIcon("none");
      return this;
    },

    setLabel: function(label) {
      this.label = label;
      if (this.nodes.$title) {
        this.nodes.$title.find("span").text(label);
      }
      if (this.nodes.$menuItemLabel) {
        this.nodes.$menuItemLabel.html(label);
      }
      return this;
    },

    setIcon: function(iconClass) {
      // ensure a bootstrap conform icon class
      if (!/^glyphicon\ glyphicon\-/.test(iconClass)) {
        iconClass = "glyphicon glyphicon-" + iconClass;
      }
      this.iconClass = iconClass;
      if (this.nodes.$title) {
        this.nodes.$title.find("i").attr("class", iconClass);
      }
      if (this.nodes.$menuItemIcon) {
        this.nodes.$menuItemIcon.attr("class", iconClass);
      }
      return this;
    },

    addCss: function(file) {
      // append a css file ref to the global head tag
      // the file will be relative to /static/css
      $("<link rel='stylesheet'></link>")
        .attr("href", window._hcData.root + "plugins/" + this.name + "/static/css/" + file)
        .appendTo("head");
      return this;
    },

    _resolve: function(method, path) {
      // creates functions that invoke http requests,
      // might not be used by plugins directly
      var args = Array.prototype.slice.call(arguments, 2);
      if (path.substr(0, 1) == "/") {
        path = path.substr(1);
      }
      path = window._hcData.root + "plugins/" + this.name + "/" + path;
      args.unshift(path);
      return $[method].apply($, args);
    },

    GET: function() {
      // invoke a GET request
      var args = Array.prototype.slice.call(arguments);
      args.unshift("get");
      return this._resolve.apply(this, args);
    },

    POST: function() {
      // invoke a POST request
      var args = Array.prototype.slice.call(arguments);
      args.unshift("post");
      return this._resolve.apply(this, args);
    },

    getTemplate: function(path, data) {
      // return a jade-rendered template
      var args = Array.prototype.slice.call(arguments, 2);
      if (typeof data === "function") {
        args.unshift(data);
        data = null;
      }
      args = ["_template", { path: path, data: data || {} }].concat(args);
      return this.GET.apply(this, args);
    },

    onShow: function() {
      // called when the plugin is shown
      return this;
    },

    onHide: function() {
      // called when the plugin is hidden
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
