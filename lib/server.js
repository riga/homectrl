// lib/server.js

/**
 * homectrl server.
 */


// node modules
var fs     = require("fs");
var path   = require("path");
var extend = require("util")._extend;
var exec   = require("child_process").exec;

// npm modules
var express      = require("express");
var nconf        = require("nconf");
var winston      = require("winston");
var morgan       = require("morgan");
var compression  = require("compression");
var session      = require("express-session");
var bodyParser   = require("body-parser");
var cookieParser = require("cookie-parser");
var less         = require("less-middleware");
var cleanCss     = require("less-plugin-clean-css");
var jade         = require("jade");
var io           = require("socket.io");
var async        = require("async");
var mongodb      = require("mongodb");
var Agenda       = require("agenda");

// local modules
var Emitter = require("./emitter");
var cli     = require("./cli");
var auth    = require("./middleware/auth");
var lang    = require("./middleware/lang");
var routes  = require("./routes");
var http    = require("./http");
var util    = require("./util");
var Plugin  = require("./plugin");


/**
 * Server class definition.
 */

var Server = Emitter._extend({

  /**
   * Constructor.
   *
   * @param {object} args - Parsed arguments from CLI.
   */
  init: function init(args) {
    init._super.call(this);

    var self = this;


    /**
     * Instance members.
     */

    // store the cli args.
    this.args = args;

    // server components
    this.config       = null;
    this.dynamicRoot  = null;
    this.staticRoot   = null;
    this.loggerConfig = null;
    this.logger       = null;
    this.lessConfig   = null;
    this.mongodb      = null;
    this.agenda       = null;
    this.app          = null;
    this.server       = null;
    this.io           = null;
    this.sessionMW    = null;
    this.sessionStore = null;
    this.sockets      = {};
    this.plugins      = {};

    // flags
    this.stopping = false;


    /**
     * Setup.
     */

    // bind shutdown hooks
    ["SIGTERM", "SIGINT", "SIGQUIT"].forEach(function(signal) {
      process.on(signal, self.stop.bind(self, signal));
    });

    process.nextTick(function() {
      self.setup(function(err) {
        if (err) {
          throw err;
        }

        self.start();
      });
    });
  },


  /**
   * Starts the express app.
   */
  start: function() {
    var host = this.config.get("app:host");
    var port = this.config.get("app:localPort");
    var root = this.config.get("app:root");

    this.logger.info("start serving at http://%s:%s%s", host, port, http.join(root));

    this.server = this.app.listen(port, host);


    return this;
  },


  /**
   * Exits the whole process.
   *
   * @param {string} [signal=SIGTERM] - The signal to used for stopping.
   */
  stop: function(signal) {
    var self = this;

    if (this.stopping) {
      return this;
    }
    this.stopping = true;

    // default signal
    if (signal === undefined) {
      signal = "SIGTERM";
    }

    signal = signal.toUpperCase();

    (this.logger || console).log("info", "received %s, shutdown", signal);


    // create callbacks that will be called in parallel
    var shutdownCallbacks = [];

    // call each plugin's shutdown method, exit when they're done
    Object.keys(this.plugins).forEach(function(pluginName) {
      shutdownCallbacks.push(function(callback) {
        self.plugins[pluginName].shutdown(signal, callback);
      });
    });

    // shutdown agenda
    shutdownCallbacks.push(function(callback) {
      if (self.agenda) {
        self.logger.info("stop agenda");
        self.agenda.stop(function() {
          callback();
        });
      } else {
        callback();
      }
    });

    // shutdown websockets
    shutdownCallbacks.push(function(callback) {
      if (self.io) {
        self.logger.info("stop websockets");
        self.io.sockets.server.close();
      }
      callback();
    });

    // showdown express
    shutdownCallbacks.push(function(callback) {
      if (self.server) {
        self.logger.info("stop express app");
        self.server.close();
      }
      callback();
    });


    // process all callbacks
    async.series(shutdownCallbacks, function() {
      var code = signal == "SIGTERM" ? 0 : 1;

      self.logger.info("exit %s", code);
      process.exit(code);
    });


    return this;
  },


  /**
   * Sets up all server components such as the logger or the express ap.
   *
   * @param {function} callback - Function called after setup.
   */
  setup: function(callback) {
    var self = this;

    if (callback === undefined) {
      callback = function(){};
    }


    /**
     * Create a callback queue that contains setup callbacks
     * and that will processed at the end of this method.
     */

    var queue = [];


    /**
     * Load configs.
     */

    queue.push(function(callback) {
      self.config = nconf.use("memory").env();

      fs.readdirSync("conf").forEach(function(name) {
        var file = path.join("conf", name);

        // skip anything but files
        if (!fs.statSync(file).isFile()) {
          return;
        }

        var data = util.readConfig(file);

        if (data instanceof Error) {
          console.error("failed to load config from '%s': %s", file, data.message);
        } else {
          console.log("load config from '%s'", file);
          self.config.add(name, { type: "literal", store: data });
        }
      });

      callback(null);
    });


    /**
     * Default configs.
     */

    queue.push(function(callback) {
      // app ports
      if (self.config.get("app:publicPort") == null) {
        self.config.set("app:publicPort", self.config.get("app:localPort"));
      }

      // websocket ports
      if (self.config.get("websocket:publicPort") == null) {
        self.config.set("websocket:publicPort", self.config.get("websocket:localPort"));
      }

      // user for authentication
      if (self.config.get("auth:user") == null) {
        self.config.set("auth:user", process.env["USER"]);
      }

      callback(null);
    });


    /**
     * Dynamic, static and websocket roots.
     */

    queue.push(function(callback) {
      self.dynamicRoot = http.join(self.config.get("app:root"));
      self.staticRoot  = http.join(self.config.get("app:root"), "static");

      callback(null);
    });


    /**
     * Create the logger.
     */

    queue.push(function(callback) {
      // first we update the log method of winston loggers to prefix
      // a logger's name to the log messages
      winston.Logger.prototype._log = winston.Logger.prototype.log;
      winston.Logger.prototype.log = function() {
        var args = Array.prototype.slice.call(arguments);
        if (typeof(this.name) == "string") {
          args[1] = this.name + " - " + args[1]; 
        }
        this._log.apply(this, args);
      };

      // we use winston transports
      var transports = [];
      var transportConfig = self.config.get("logging:transports");

      for (var transportType in transportConfig) {
        var configs = transportConfig[transportType];

        for (var i in configs) {
          var config = configs[i];

          // when the transport is file based, add the log file from the cli args
          // to the transport config
          if (transportType == "File") {
            if (!self.args.logFile) {
              // don't create a transport when there's no log file
              continue;
            }

            // "touch" the file if it does not exist
            if (!fs.existsSync(self.args.logFile)) {
              fs.writeFileSync(self.args.logFile, "");
            }

            config = extend({ filename: self.args.logFile }, config);
          }

          // create the actual transport
          var transport = new winston.transports[transportType](config);
          transports.push(transport);
        }
      }

      // store the entire logger config
      self.loggerConfig = {
        levels    : self.config.get("logging:levels"),
        colors    : self.config.get("logging:colors"),
        transports: transports
      };

      // create the main logger
      self.logger = new winston.Logger(self.loggerConfig);
      self.logger.name = "homectrl";
      self.logger.info("setup winston logger");


      callback(null);
    });


    /**
     * Mongodb intance.
     */

    queue.push(function(callback) {
      var url  = self.config.get("mongodb:url");
      var opts = self.config.get("mongodb:options");
      self.logger.info("setup mongodb");
      self.mongodb = mongodb.MongoClient.connect(url, opts, function(err, db) {
        if (err) {
          return callback(err);
        }

        self.mongodb = db;

        callback(null);
      });
    });


    /**
     * Agenda instance.
     */

    queue.push(function(callback) {
      self.logger.info("setup agenda");

      self.agenda = new Agenda(self.config.get("agenda"));
      self.agenda.start();

      callback(null);
    });


    /**
     * Express app.
     */

    queue.push(function(callback) {
      self.logger.info("setup express app");

      self.app = express();

      // create a stream for morgan access logs that uses our logger
      var loggerStream = {
        write: function(message) {
          // remove \n's from the end of each line
          if (message.substr(-1) == "\n") {
            message = message.substr(0, message.length - 1);
          }
          self.logger.access(message);
        }
      };
      self.app.use(morgan("combined", { stream: loggerStream }));

      // gzip compression
      self.app.use(compression());

      // body parser
      self.app.use(bodyParser.urlencoded({ extended: true }));

      // cookie parser
      var secret = self.config.get("session:secret");
      self.app.use(cookieParser(secret));

      // memory based sessions
      var sessionConfig   = self.config.get("session");
      sessionConfig.store = new session.MemoryStore();
      self.sessionMW      = session(sessionConfig);
      self.sessionStore   = sessionConfig.store;
      self.app.use(self.sessionMW);

      // basic auth
      var userName = self.config.get("auth:user");
      var userPass = self.config.get("auth:pass");
      var deadtime = self.config.get("auth:deadtime");
      var exceptRE = new RegExp("^" + http.join(self.staticRoot, "public") + ".*$");
      self.app.use(auth(userName, userPass, deadtime, exceptRE));

      // language middleware
      var language  = self.config.get("client:language");
      var available = self.config.get("client:availableLanguages");
      self.app.use(lang(language, available));

      // jade
      self.app.engine("jade", jade.__express);
      self.app.set("views", ".");
      self.app.set("view options", { layout: false });

      // less
      self.lessConfig = {
        render: {
          plugins: [ new cleanCss({ keepSpecialComments: 1, keepBreaks: true }) ]
        }
      };
      self.app.use(self.staticRoot, less("static", self.lessConfig));

      // static
      var cacheOpts = self.config.get("cache");
      self.app.use(self.staticRoot, express.static("static", cacheOpts));

      // apply the routes
      routes(self);

      callback(null);
    });


    /**
     * Websockets.
     */

    queue.push(function(callback) {
      self.logger.info("setup websockets");

      self.io = io(self.config.get("websocket:localPort"));

      // authentication handshake using the session store
      self.io.use(function(socket, next) {
        var _next = function(err) {
          if (err) {
            self.logger.warning("invalid socket (%s): %s", socket.id, err.message);
          }
          next(err);
        };

        self.sessionMW(socket.request, socket.request.res, function(err) {
          if (err) {
            return _next(err);
          }

          self.sessionStore.get(socket.request.session.id, function(err, session) {
            if (err) {
              _next(err);
            } else if (!session) {
              _next(new Error("invalid socket"));
            } else {
              _next();
            }
          });
        });
      });

      // store connected sockets
      self.io.on("connection", function(socket) {
        self.sockets[socket.id] = socket;

        self.logger.debug("register socket", socket.id);

        // send back the id
        socket.emit("id", socket.id);

        // remove again on disconnect
        socket.on("disconnect", function() {
          delete self.sockets[socket.id];
          self.logger.debug("deregister socket", socket.id);
        });

        // dispatch incomming messages for plugins
        socket.on("message.plugin", function(pluginName, topic) {
          var p = self.plugins[pluginName];
          if (!p) {
            var msg = "incomming message for unknown plugin '%s': %s (%s)";
            self.logger.warn(msg, pluginName, topic, socket.id);
            return;
          }

          var msg = "incomming message: %s (%s)";
          p.logger.debug(msg, topic, socket.id);

          // prepend the proper topic and the socket id
          var args = Array.prototype.slice.call(arguments, 2);
          args = ["in." + topic, socket.id].concat(args);

          // emit the message for the plugin
          p.emit.apply(p, args);
        });
      });

      callback(null);
    });


    /**
     * Setup plugins.
     */

    // loop through all files in the plugins directory
    fs.readdirSync("plugins").forEach(function(pluginName) {
      var pluginRoot = path.join("plugins", pluginName);

      // directory?
      if (!fs.statSync(pluginRoot).isDirectory()) {
        return;
      }

      // omit dirs beginning with an underscore
      if (pluginName[0] == "_") {
        return;
      }

      queue.push(function(callback) {
        self.logger.info("setup plugin '%s'", pluginName);

        // install plugin first if necessary
        self.installPlugin(pluginName, function(err) {
          if (err) {
            self.logger.error("installation of plugin '%s' failed: %s", pluginName, err.message);
            return callback(err);
          }

          self.logger.debug("installed plugin '%s'", pluginName);

          // get the custom plugin class
          var PluginCls = require("../" + pluginRoot);

          // class check
          if (!("_extends" in PluginCls) || !PluginCls._extends(Plugin)) {
            var err = new Error("plugin '" + pluginName + "' does not export a Plugin class");
            return callback(err);
          }

          // create and store an instance
          self.plugins[pluginName] = new PluginCls(self, pluginName);

          // call its setup
          self.plugins[pluginName].setup();

          callback(null);
        });
      });
    });


    /**
     * Process the queue.
     */

    async.series(queue, function(err) {
      if (err) {
        return callback(err);
      }

      callback(null);
    });


    return this;
  },


  /**
   * Installs up a plugin. At the moment, only npm.
   *
   * @param {string} name - The name of the plugin.
   * @param {function} callback - Function called after installation.
   */
  installPlugin: function(name, callback) {
    if (callback === undefined) {
      callback = function(){};
    }

    var pluginRoot = path.join("plugins", name);


    // copy sample config files
    util.copySamples(path.join(pluginRoot, "conf"));


    // npm -> package.json
    var viaNpm = fs.existsSync(path.join(pluginRoot, "package.json"));


    if (viaNpm) {
      exec("npm install", { cwd: pluginRoot }, callback);
    } else {
      callback(null);
    }


    return this;
  }
});


/**
 * Server initialization and startup.
 */

var server = new Server(cli());
