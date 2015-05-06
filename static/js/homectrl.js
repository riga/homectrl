// static/homectrl.js

/**
 * This module defines the main homectrl objects
 * and should be required by plugins for accessing them. 
 */


define(["emitter", "jquery", "io", "async"], function(Emitter, $, io, async) {

  var hc, Plugin;


  /**
   * homectrl main class definition.
   */

  var HomeCtrl = Emitter._extend({

    /**
     * Constructor.
     */
    init: function init() {
      init._super.call(this);

      var self = this;


      /**
       * Instance members.
       */

      // dynamic and static root
      this.dynamicRoot = window.hcData.dynamicRoot;
      this.staticRoot  = window.hcData.staticRoot;

      // a logger
      if (!window.hcData.logging) {
        $.Logger().disable();
      }
      this.logger = $.Logger("homectrl");

      // jQuery DOM nodes
      this.nodes = {};

      // websocket connection
      this.socket = null;

      // plugins
      this.plugins = {};

      // state variables
      this.currentViewName = null;

      // store plugin names
      this.pluginNames = window.hcData.plugins;


      /**
       * Setup.
       */

      var setupQueue = [];

      // user interface
      setupQueue.push(this.setupUI.bind(this));

      // websocket connection
      setupQueue.push(this.setupSocket.bind(this));

      // plugins
      setupQueue.push(this.setupPlugins.bind(this));

      // process the queue
      async.series(setupQueue, function(err) {
        if (err) {
          throw err;
        }

        // initially, apply the first hash
        self.applyHash();
      });
    },


    /**
     * Sets up the user interface, i.e. nodes and events.
     *
     * @param {function} callback - A function called when done.
     * @returns {this}
     */
    setupUI: function(callback) {
      var self = this;

      if (callback === undefined) {
        callback = function(){};
      }


      /**
       * Find and store jQuery DOM nodes.
       */

      this.nodes.$main           = $("#homectrl").first();
      this.nodes.$menu           = this.nodes.$main.find("#menu").first();
      this.nodes.$menuItemHook   = this.nodes.$menu.find("#menu-item-hook").first();
      this.nodes.$menuToggle     = this.nodes.$main.find("#page > #header #menu-toggle").first();
      this.nodes.$menuTypeSwitch = this.nodes.$main.find("#menu-type-switch input").first();
      this.nodes.$reload         = this.nodes.$main.find("#page > #header #reload").first();
      this.nodes.$logout         = this.nodes.$main.find("#page > #header #logout").first();
      this.nodes.$shutdown       = this.nodes.$main.find("#page > #header #shutdown").first();
      this.nodes.$content        = this.nodes.$main.find("#page > #content").first();
      this.nodes.$blocker        = this.nodes.$main.find("#page > #blocker").first();
      this.nodes.$titleHook      = this.nodes.$main.find("#page > #header #title-hook").first();


      /**
       * Setup some nodes.
       */

      // setup the menu type switch
      this.nodes.$menuTypeSwitch.bootstrapSwitch({
        size: "mini",
        onSwitchChange: function(_, state) {
          self.toggleMenuType(state);
        }
      });

      // set its initial state based on the cookie
      this.nodes.$menuTypeSwitch.bootstrapSwitch("state", $.cookie("menuOnCanvas") == "true");


      /**
       * Bind events.
       */

      // menu toggle button
      this.nodes.$menuToggle.click(function(event) {
        self.toggleMenu();
        this.blur();
      });

      // reload button
      this.nodes.$reload.click(function(event) {
        window.location.reload();
      });

      // logout button
      this.nodes.$logout.click(function(event) {
        if (window.confirm("Do you really want to logout?")) {
          $.post(self.dynamicRoot + "logout");
        }
      });

      // shutdown button
      this.nodes.$shutdown.click(function(event) {
        if (window.confirm("Do you really want to shutdown?")) {
          $.post(self.dynamicRoot + "shutdown");
        }
      });

      // clicks in the blocker
      this.nodes.$blocker.click(function(event) {
        event.preventDefault();
        self.toggleMenu(false);
      });

      // clicks in menu items, except plugin menu items
      $("#menu > ul > li > a").click(function(event) {
        if (!self.menuIsOnCanvas()) {
          self.toggleMenu(false);
        }
      });

      // react to hash changes
      $(window).on("hashchange", this.applyHash.bind(this));


      /**
       * Final actions.
       */

      // hide the splashscreen
      $("#splashscreen").hide();


      this.logger.info("setup UI");

      // callback
      callback(null);


      return this;
    },


    /**
     * Sets up the websocket connection.
     *
     * @param {function} callback - A function called when done.
     * @returns {this}
     */
    setupSocket: function(callback) {
      var self = this;

      if (callback === undefined) {
        callback = function(){};
      }

      // build up the connection
      var wsHost  = window.location.protocol + "//" + window.location.hostname + ":"
                  + window.hcData.wsPort;
      this.socket = io.connect(wsHost, { path: window.hcData.wsRoot });

      this.logger.info("setup websocket at '%s%s'", wsHost, window.hcData.wsRoot);

      // store the socket id in a cookie so that it is sent in each http request
      this.socket.on("id", function(id) {
        $.cookie("socketId", id);
      });

      // handle incomming plugin messages
      this.socket.on("message.plugin", function(pluginName, topic) {
        var p = self.plugins[pluginName];

        if (!(p instanceof Plugin)) {
          return;
        }

        var args = Array.prototype.slice.call(arguments, 2);

        // prepend "in.<topic>" to mark the message as _incomming_
        args.unshift("in." + topic);

        // send
        p.emit.apply(p, args);
      });

      this.socket.on("connect", callback);


      return this;
    },


    /**
     * Sets up all plugins.
     *
     * @param {function} callback - A function called when done.
     * @returns {this}
     */
    setupPlugins: function(callback) {
      var self = this;

      if (callback === undefined) {
        callback = function(){};
      }


      // create plugin module names for requirejs
      var pluginModules = this.pluginNames.map(function(name) {
        return self.dynamicRoot + "plugins/" + name + "/static/js/index.js";
      });

      this.logger.info("setup plugins");

      // require plugins in parallel
      require(pluginModules, function() {
        var classes = Array.prototype.slice.call(arguments);

        for (var i in classes) {
          var Cls  = classes[i];
          var name = self.pluginNames[i];

          // create and store a new plugin instance
          self.plugins[name] = new Cls(name);
        }

        // finally, call the callback
        callback(null);
      });


      return this;
    },


    /**
     * Action that handles hash changes. This is important for view changes.
     *
     * @returns {this}
     */
    applyHash: function() {
      // take the hash from the url
      var hash = window.location.hash;

      // get the view name
      var viewName = hash.substr(1);

      // when there is no hash/viewName, use the first plugin name
      if (!viewName) {
        if (this.pluginNames.length) {
          viewName = this.pluginNames[0];
        } else {
          return this;
        }
      }

      // show the respective view
      this.showView(viewName);


      return this;
    },


    /**
     * Shows a specific view. This might be an internal page, such as the #about page,
     * or a plugin. This does not change the hash.
     *
     * @param {string} viewName - The name of the view.
     * @returns {this}
     */
    showView: function(viewName) {
      // do nothing when there's no view change
      if (!viewName || viewName == this.currentViewName) {
        return this;
      }

      // hide the current view first
      this.hideCurrentView();

      // create the hash
      var hash = "#" + viewName;

      // create the page title appendix
      var title = viewName;

      // a plugin?
      if (~this.pluginNames.indexOf(viewName)) {
        var p = this.plugins[viewName];

        if (!(p instanceof Plugin)) {
          return this;
        }

        // update hash
        hash += ".plugin#" + viewName;

        // update the title
        title = p.label;

        // call its onShow method
        p.onShow();
      }

      // show content, update menu entry and title
      this.nodes.$content.find(hash).show();
      this.nodes.$menu.find(hash).toggleClass("active", true);
      this.nodes.$titleHook.find(hash).show();

      // update the global title tag
      $("head > title").html("homectrl - " + title);

      // set the current view name
      this.currentViewName = viewName;

      this.logger.debug("show view '%s'", viewName);


      return this;
    },


    /**
     * Hides the current view (if any). This does not change the hash.
     *
     * @returns {this};
     */
    hideCurrentView: function() {
      if (!this.currentViewName) {
        return this;
      }

      var hash = "#" + this.currentViewName;

      // a plugin?
      if (~this.pluginNames.indexOf(this.currentViewName)) {
        var p = this.plugins[this.currentViewName];
        if (p) {
          p.onHide();
        }

        // update the hash
        hash += ".plugin";
      }

      // hide content, update meny entry and title
      this.nodes.$content.find(hash).hide();
      this.nodes.$menu.find(hash).toggleClass("active", false);
      this.nodes.$titleHook.find(hash).hide();

      // update the global title tag
      $("head > title").html("homectrl");

      this.logger.debug("hide view '%s'", this.currentViewName);

      // finally, reset the current view name and the current hash
      this.currentViewName = null;


      return this;
    },


    /**
     * Returns true of the menu is open, or false otherwise.
     *
     * @returns {boolean}
     */
    menuIsOpen: function() {
      return this.nodes.$main.hasClass("menu-open") || this.menuIsOnCanvas();
    },


    /**
     * Returns true if the menu is on-canvas, or false otherwise.
     *
     * @returns {boolean}
     */
    menuIsOnCanvas: function() {
      return this.nodes.$main.hasClass("menu-on-canvas");
    },


    /**
     * Toggles the menu.
     *
     * @param {boolean} [state] - If set, `state` determines whether the menu should be shown or
     *   hidden. Otherwise, the menu is toggled.
     * @returns {this}
     */
    toggleMenu: function(state) {
      if (state !== undefined) {
        // convert truthy to boolean
        state = !!state;
      } else {
        state = !this.menuIsOpen();
      }

      if (!state && this.menuIsOnCanvas()) {
        this.toggleMenuType(false);
      }

      // simply add or remove the menu-open class,
      // all changes are css-based
      this.nodes.$main.toggleClass("menu-open", state);


      return this;
    },


    /**
     * Toggles the menu type, i.e. on- or off-canvas.
     *
     * @param {boolean} [state] - If set, `state` determines whether the menu should be on-canvas
     *   or not. Otherwise, the type is toggled.
     * @returns {this}
     */
    toggleMenuType: function(state) {
      if (state !== undefined) {
        // convert truthy to boolean
        state = !!state;
      } else {
        state = !this.menuIsOnCanvas();
      }

      // simply add or remove the menu-on-canvas class,
      // all changes are css-based
      this.nodes.$main.toggleClass("menu-on-canvas", state);

      // make sure the switch is in it's correct position
      this.nodes.$menuTypeSwitch.bootstrapSwitch("state", state, true);

      // also set a cookie
      $.cookie("menuOnCanvas", state);


      return this;
    }
  });

  
  /**
   * Prepare exports.
   */

  var exports = {};


  /**
   * Plugin class definition.
   */

  Plugin = Emitter._extend({

    /**
     * Constructor. Plugins should use the setup method rather than this constructor to process
     * custom setup actions.
     *
     * @param {string} name - The plugin name.
     */
    init: function init(name) {
      init._super.call(this, { wildcard: true });

      var self = this;


      /**
       * Instace members.
       */

      // plugin name
      this.name = name;

      // dynamic and static root
      this.dynamicRoot = window.hcData.dynamicRoot + "plugins/" + name + "/";
      this.staticRoot  = this.dynamicRoot + "static/";

      // a logger
      this.logger = $.Logger(name);

      // store values managed by property descriptors
      this.__label     = null;
      this.__iconClass = null;

      // jQuery DOM nodes
      this.nodes = {
        $wrapper : null,
        $content : null,
        $messages: null,
        $title   : null,
        $menuItem: null
      };

      // message queue
      this.messages = [];


      /**
       * Socket message handling
       */

      // catch and adjust emitted _outgoing_ messages
      this.on("out.*", function() {
        var args  = Array.prototype.slice.call(arguments);

        var event = this.event.split(".");
        var topic = event[1];

        // prepend the message topic ("message.plugin"), the plugin name,
        // and the actual event to the arguments
        args = ["message.plugin", self.name, topic].concat(args);

        // send
        hc.socket.emit.apply(hc.socket, args);
      });


      /**
       * User interface.
       */

      // html templates
      var wrapperTmpl  = "<div class='plugin'><div class='content'></div><div class='messages'></div></div>";
      var menuItemTmpl = "<li class='plugin'><a><i></i> <span></span></a></li>";
      var titleTmpl    = "<span class='plugin'><i></i> <span></span></span>";

      // setup the wrapper node
      this.nodes.$wrapper = $(wrapperTmpl)
      .appendTo(hc.nodes.$content)
      .attr("id", name);

      // store content and messages divs
      this.nodes.$content  = this.nodes.$wrapper.find(".content");
      this.nodes.$messages = this.nodes.$wrapper.find(".messages");

      // add the menu item before the divider
      this.nodes.$menuItem = $(menuItemTmpl)
      .insertBefore(hc.nodes.$menuItemHook)
      .attr("id", name);

      // adjust the href attribute
      this.nodes.$menuItem.find("a").attr("href", "#" + name);

      // title node
      this.nodes.$title = $(titleTmpl)
      .appendTo(hc.nodes.$titleHook)
      .attr("id", name);

      // menu event
      this.nodes.$menuItem.find("a").click(function(event) {
        if (!hc.menuIsOnCanvas()) {
          hc.toggleMenu(false);
        }
      });


      // at the moment, all constructor actions are synchronous
      // so simply call the setup method here
      this.setup();
    },


    /**
     * Sets up the plugin. The constructor is called by the main homectrl instance, then, UI
     * components are (asynchronously) loaded. After that, the setup method is called.
     *
     * @returns {this}
     */
    setup: function() {
      // initially, use the name as label and an empty icon class
      this.label     = this.name;
      this.iconClass = "none";

      this.logger.info("setup");

      return this;
    },


    /**
     * Property access descriptor for the label.
     *
     * Setter:
     * @param {string} label - The new label.
     */
    label: {
      descriptor: true,

      get: function() {
        return this.__label;
      },

      set: function(label) {
        this.__label = label;

        // set the label in the title node
        if (this.nodes.$title) {
          this.nodes.$title.find("span").text(label);
        }

        // set the label in the menu entry
        if (this.nodes.$menuItem) {
          this.nodes.$menuItem.find("a > span").html(label);
        }

        this.logger.debug("set label to '%s'", label);
      }
    },


    /**
     * Property access descriptor for the icon class.
     *
     * Setter:
     * @param {string} iconClass - A new icon class. At the moment, only bootstrap icons are
     *   supported. If `iconClass` does not start with "glyphicon glyphicon-", it gets prepended.
     */
    iconClass: {
      descriptor: true,

      get: function() {
        return this.__iconClass;
      },

      set: function(iconClass) {
        // ensure a bootstrap conform icon class
        if (!/^glyphicon\ glyphicon\-/.test(iconClass)) {
          iconClass = "glyphicon glyphicon-" + iconClass;
        }

        this.__iconClass = iconClass;

        // set the icon class in the title node
        if (this.nodes.$title) {
          this.nodes.$title.find("i").attr("class", iconClass);
        }

        // set the icon class in the menu entry
        if (this.nodes.$menuItem) {
          this.nodes.$menuItem.find("a > i").attr("class", iconClass);
        }

        this.logger.debug("set icon class to '%s'", iconClass);
      }
    },


    /**
     * Property access descriptor for the visibility state. Getter only.
     */
    visible: {
      descriptor: true,

      get: function() {
        return this.nodes.$wrapper.css("display") != "none";
      }
    },


    /**
     * General helper method for ajax requests.
     *
     * @param {string} method - The http method to use, e.g. "get" or "post".
     * @param {string} path - The path to query, relative to the plugins dynamic root.
     * @param {object} [data] - The request data.
     * @param {function} [callback]- A callback that is invoked with three arguments: an error (or
     *   null), the data field of the response, and the respose object itself.
     * @returns {this}
     */
    ajax: function(method, path, data, callback) {
      // prepare arguments
      method = method.toLowerCase();

      if (path[0] == "/") {
        path = path.substr(1);
      }
      path = this.dynamicRoot + path;

      if (callback === undefined) {
        if (data instanceof Function) {
          callback = data;
          data     = {};
        } else {
          callback = function(){};
        }
      }
      if (data === undefined) {
        data = {};
      }

      // perform the request
      $[method](path, data).always(function(jqXHRFail, statusString, jqXHRSuccess) {
        var jqXHR = statusString == "success" ? jqXHRSuccess : jqXHRFail;

        var res = jqXHR.responseJSON || {
          code   : jqXHR.status,
          data   : jqXHR.responseText,
          message: jqXHR.status == 200 ? null : jqXHR.statusText
        };

        if (res.code == 200) {
          callback(null, res.data, res);
        } else {
          callback(new Error(res.message), null, res);
        }
      });

      return this;
    },


    /**
     * Gets a jade template via a GET request.
     *
     * @param {string} path - The path of the template relative to the "views" directory.
     * @param {object} [data] - Data for template rendering. Server-side configurable template
     *   data and some default values are available as well.
     * @param {function} [callback] - A callback that is passed to `ajax`.
     * @returns {this}
     */
    getTemplate: function(path, data, callback) {
      if (callback === undefined) {
        if (data instanceof Function) {
          callback = data;
          data     = null;
        } else {
          callback = function(){};
        }
      }
      if (data == undefined || (typeof(data) == "object" && Object.keys(data).length == 0)) {
        data = null;
      }

      this.logger.debug("request template '%s' with data '%o'", path, data);

      this.ajax("get", "_template", { path: path, data: data }, callback);

      return this;
    },


    /**
     * Shows an alert message.
     *
     * @param {string} msg - The message to alert.
     * @param {object} options - Options. Fields with default values are: dismissible (true),
     *   alertClass (alert-danger), timeout (4000)
     * @returns {this}
     */
    alert: function(msg, options) {
      var self = this;

      options = $.extend({
        dismissible: true,
        alertClass : "alert-danger",
        timeout    : 4000
      }, options);

      var message = function() {
        var $message = $("<div>")
        .addClass("alert " + options.alertClass)
        .css("display", "none")
        .html(msg);

        if (options.dismissible) {
          $("<button>")
          .addClass("close")
          .attr("data-dismiss", "alert")
          .attr("aria-label", "Close")
          .html("<span aria-hidden='true'>&times;</span>")
          .prependTo($message);
        }

        $message.appendTo(self.nodes.$messages).fadeIn(200);

        var timeout = window.setTimeout(function() {
          $message.fadeOut(200, function() {
            $message.alert("close");
          });
        }, options.timeout);

        $message.on("closed.bs.alert", function() {
          window.clearTimeout(timeout);
        });
      };

      if (this.visible) {
        message();
      } else {
        this.messages.push(message);
      }

      return this;
    },


    /**
     * Method called when the plugin is shown.
     *
     * @returns {this}
     */
    onShow: function() {
      var self = this;

      this.logger.info("show");

      // show queued messages
      window.setTimeout(function() {
        self.messages.forEach(function(message) {
          message();
        });
      }, 200);

      return this;
    },


    /**
     * Method called when the plugin is hidden.
     *
     * @returns {this}
     */
    onHide: function() {
      this.logger.info("hide");

      return this;
    }
  });


  /**
   * Create the homctrl instance.
   */

  window.hc = hc = new HomeCtrl();

  // store the plugin class
  hc.Plugin = Plugin;


  return hc;
});
