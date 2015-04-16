// static/homectrl.js

/**
 * This module defines the main homectrl objects
 * and should be required by plugins for accessing them. 
 */


define(["emitter", "jquery", "io", "vendor/async"], function(Emitter, $, io, async) {

  var homectrl, Plugin;


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
      this.logger = $.Logger("homectrl");

      // jQuery DOM nodes
      this.nodes = {};

      // websocket connection
      this.socket = null;

      // plugins
      this.plugins = {};

      // state variables
      this.menuOpen        = false;
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

      this.nodes.$main         = $("#homectrl").first();
      this.nodes.$menu         = this.nodes.$main.find("#menu").first();
      this.nodes.$menuItemHook = this.nodes.$menu.find("#menu-item-hook").first();
      this.nodes.$menuToggle   = this.nodes.$main.find("#page > #header #menu-toggle").first();
      this.nodes.$reload       = this.nodes.$main.find("#page > #header #reload").first();
      this.nodes.$logout       = this.nodes.$main.find("#page > #header #logout").first();
      this.nodes.$shutdown     = this.nodes.$main.find("#page > #header #shutdown").first();
      this.nodes.$content      = this.nodes.$main.find("#page > #content").first();
      this.nodes.$blocker      = this.nodes.$main.find("#page > #blocker").first();
      this.nodes.$titleHook    = this.nodes.$main.find("#page > #header #title-hook").first();


      /**
       * Bind events.
       */

      // menu toggle button
      this.nodes.$menuToggle.click(function(event) {
        self.toggleMenu();
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

      // clicks in menu items
      $("#menu > ul > li > a").click(function(event) {
        self.toggleMenu(false);
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
        return "plugins/" + name + "/index";
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
     * Show a specific view. This might be an internal page, such as the #about page,
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
        title = p._label;

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
     * Toggle the menu.
     *
     * @param {boolean} [state] - If set, `state` determines whether the menu should be shown or
     *   hidden. Otherwise, the menu is toggled.
     * @returns {this}
     */
    toggleMenu: function(state) {
      if (state !== undefined) {
        // convert truthy to boolean
        state = !!state;
      }

      // change?
      if (state == this.menuOpen) {
        // nothing happens
        return this;
      }

      this.menuOpen = !this.menuOpen;

      // simply add or remove the menu-open class,
      // all changes are css-based
      this.nodes.$main.toggleClass("menu-open", this.menuOpen);


      return this;
    },


    /**
     * Parses a response object as defined in lib/http.js/send and invokes a callback with two
     * parameters: 1. an error object or null, 2. the response data.
     *
     * @param {object} res - The response object to parse.
     * @param {function} [callback] - A function to call.
     * @returns An error object (if any) or the response data.
     */
    parseResponse: function(res, callback) {
      if (callback === undefined) {
        callback = function(){};
      }

      var result;

      // response successful when status is 200
      if (res.status == 200) {
        result = res.data;
        callback(null, result);
      } else {
        result = new Error(res.message);
        result.status = res.status;
        callback(result);
      }

      return result;
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

      // store the current label and icon class
      this._label     = null;
      this._iconClass = null;

      // jQuery DOM nodes
      this.nodes = {
        $content : null,
        $title   : null,
        $menuItem: null
      };


      /**
       * Message handling
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
        homectrl.socket.emit.apply(homectrl.socket, args);
      });


      /**
       * User interface.
       */

      // html templates
      var menuItemTmpl = "<li class='plugin'><a><i></i> <span></span></a></li>";
      var contentTmpl  = "<div class='plugin'></div>";
      var titleTmpl    = "<span class='plugin'><i></i> <span></span></span>";

      // setup the content node
      self.nodes.$content = $(contentTmpl)
      .appendTo($("#content"))
      .attr("id", name);

      // add the menu item before the divider
      self.nodes.$menuItem = $(menuItemTmpl)
      .insertBefore(homectrl.nodes.$menuItemHook)
      .attr("id", name);

      // adjust the href attribute
      self.nodes.$menuItem.find("a").attr("href", "#" + name);

      // title node
      self.nodes.$title = $(titleTmpl)
      .appendTo(homectrl.nodes.$titleHook)
      .attr("id", name);

      // menu event
      self.nodes.$menuItem.find("a").click(function(event) {
        homectrl.toggleMenu(false);
      });


      // at the moment, all constructor actions are synchronous
      // so simply call the setup method here
      self.setup();
    },


    /**
     * Sets up the plugin. The constructor is called by the main homectrl instance, then, UI
     * components are (asynchronously) loaded. After that, the setup method is called.
     *
     * @returns {this}
     */
    setup: function() {
      // initially, use the name as label and an empty icon class
      this.setLabel(this.name);
      this.setIcon("none");

      this.logger.info("setup");

      return this;
    },


    /**
     * Adds a link tag for a css file to the page head.
     *
     * @param {string} file - The name of a css file relative to the plugins "static/css" directory.
     * @returns {this}
     */
    addCss: function(file) {
      // append a css file ref to the global head tag
      // the file will be relative to /static/css
      $("<link>")
      .attr("rel", "stylesheet")
      .attr("href", this.staticRoot + "css/" + file)
      .appendTo("head");

      this.logger.debug("add css file '%s'", file);


      return this;
    },


    /**
     * Sets the plugin label in the UI.
     *
     * @param {string} label - A new label.
     * @returns {this}
     */
    setLabel: function(label) {
      this._label = label;

      // set the label in the title node
      if (this.nodes.$title) {
        this.nodes.$title.find("span").text(label);
      }

      // set the label in the menu entry
      if (this.nodes.$menuItem) {
        this.nodes.$menuItem.find("a > span").html(label);
      }

      this.logger.debug("set label to '%s'", label);

      return this;
    },


    /**
     * Sets the icon class in the UI.
     *
     * @param {string} iconClass - A new icon class. At the moment, only bootstrap icons are
     *   supported. If `iconClass` does not start with "glyphicon glyphicon-", it gets prepended.
     * @returns {this}
     */
    setIcon: function(iconClass) {
      // ensure a bootstrap conform icon class
      if (!/^glyphicon\ glyphicon\-/.test(iconClass)) {
        iconClass = "glyphicon glyphicon-" + iconClass;
      }

      this._iconClass = iconClass;

      // set the icon class in the title node
      if (this.nodes.$title) {
        this.nodes.$title.find("i").attr("class", iconClass);
      }

      // set the icon class in the menu entry
      if (this.nodes.$menuItem) {
        this.nodes.$menuItem.find("a > i").attr("class", iconClass);
      }

      this.logger.debug("set icon class to '%s'", iconClass);

      return this;
    },


    /**
     * General helper method for ajax requests.
     *
     * @param {string} method - The http method to use, e.g. "get" or "post".
     * @param {string} path - The path to query, relative to the plugins dynamic root.
     * @param {...} arguments - Arguments to be passed to the appropriate jQuery ajax call.
     * @returns {jqXHR}
     */
    ajax: function(method, path) {
      var args = Array.prototype.slice.call(arguments, 2);

      // cut any leading slash
      if (path[0] == "/") {
        path = path.substr(1);
      }

      args.unshift(this.dynamicRoot + path);

      return $[method.toLowerCase()].apply($, args);
    },


    /**
     * Wrapper around `ajax` for GET requests.
     *
     * @returns {jqXHR}
     */
    GET: function() {
      var args = Array.prototype.slice.call(arguments);

      // prepend the method
      args.unshift("get");

      return this.ajax.apply(this, args);
    },

    /**
     * Wrapper around `ajax` for POST requests.
     *
     * @returns {jqXHR}
     */
    POST: function() {
      var args = Array.prototype.slice.call(arguments);

      // prepend the method
      args.unshift("post");

      return this._resolve.apply(this, args);
    },


    /**
     * Get a jade template via a GET request.
     *
     * @param {string} path - The path of the template relative to the "views" directory.
     * @param {object} [data=null] - Data for template rendering. Server-side configurable template
     *   data and some default values are available as well.
     * @returns {jqXHR}
     */
    getTemplate: function(path, data) {
      var args = Array.prototype.slice.call(arguments, 2);

      if (data === undefined || (typeof(data) == "object" && Object.keys(data).length == 0)) {
        data = null;
      }

      // prepend the proper GET resource ("_template") and the request object 
      args = ["_template", { path: path, data: data }].concat(args);

      this.logger.debug("request template '%s' with data '%o'", path, data);

      return this.GET.apply(this, args);
    },


    /**
     * Method called when the plugin is shown.
     *
     * @returns {this}
     */
    onShow: function() {
      this.logger.info("show");

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

  window.homectrl = homectrl = new HomeCtrl();

  // store the plugin class
  homectrl.Plugin = Plugin;


  return homectrl;
});
