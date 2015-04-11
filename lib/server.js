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
var jade         = require("jade");
var io           = require("socket.io");
var async        = require("async");

// local modules
var Emitter       = require("./emitter");
var cli           = require("./cli");
var auth          = require("./middleware/auth");
var pluginRender  = require("./middleware/pluginrender");
var routes        = require("./routes");
var http          = require("./http");
var util          = require("./util");


/**
 * Server class definition.
 */
var Server = Emitter._extend({

  /**
   * Constructor.
   *
   * @param {object} args - CLI arguments. A `Command` instance (commander module) is valid as well.
   */
  init: function init(args) {
    init._super.call(this);

    var self = this;

    /**
     * Instace members.
     */

    // store the cli args.
    this.args = args;

    // server components
    this.config      = null;
    this.dynamicRoot = null;
    this.staticRoot  = null;
    this.logger      = null;
    this.express     = null;
    this.io          = null;
    this.sockets     = {};
    this.plugins     = {};


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
    var host    = this.config.get("app:host");
    var port    = this.config.get("app:port");
    var root    = this.config.get("app:root");
    var address = "http://" + host + ":" + port + http.join(root);

    this.app.listen(port, host);
    this.logger.info("Start serving at", address);


    return this;
  },


  /**
   * Exits the whole process.
   *
   * @param {string} [signal=SIGTERM] - The signal to used for stopping.
   */
  stop: function(signal) {
    if (signal === undefined) {
      signal = "SIGTERM";
    }

    signal = signal.toUpperCase();

    (this.logger || console).log("info", "Shutdown due to signal: %s", signal);


    // TODO: propagate the shutdown signal


    var exitCode = signal == "SIGTERM" ? 0 : 1;
    process.exit(exitCode);


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
     * Load configs.
     */

    this.config = nconf.use("memory").env();

    ["server.json", "logging.json"].forEach(function(name) {
      var file = path.join("conf", name);
      var data = util.readConfig(file);

      if (data != null) {
        console.log("Load local config", name);
        self.config.add(name, { type: "literal", store: data });
      }
    });

    // overwrite some configs with cli args
    var mapping = {
      host: "app:host",
      port: "app:port",
      root: "app:root"
    };
    for (var key in mapping) {
      if (self.args[key] != null) {
        self.config.set(mapping[key], self.args[key]);
      }
    }


    /**
     * Dynamic, static and websocket roots.
     */

    this.dynamicRoot = http.join(this.config.get("app:root"));
    this.staticRoot  = http.join(this.config.get("app:root"), "static");
    this.wsRoot      = http.join(this.dynamicRoot, "socket.io");


    /**
     * Create the logger.
     */

    // we use winston transports
    var transports = [];
    var transportConfig = this.config.get("logging:transports");

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

    // create the logger
    this.logger = new winston.Logger({
      levels    : this.config.get("logging:levels"),
      colors    : this.config.get("logging:colors"),
      transports: transports
    });

    this.logger.info("Setup winston logger");


    /**
     * Express app.
     */

    this.app = express();

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
    this.app.use(morgan("combined", { stream: loggerStream }));

    // gzip compression
    this.app.use(compression());

    // body parser
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // cookie parser
    var secret = this.config.get("session:secret");
    this.app.use(cookieParser(secret));

    // memory based sessions
    var sessionConfig = this.config.get("session");
    sessionConfig.store = new session.MemoryStore();
    this.app.use(session(sessionConfig));

    // basic auth
    var userName = this.config.get("auth:user") || process.env["USER"];
    var userPass = this.config.get("auth:pass");
    var deadtime = this.config.get("auth:deadtime");
    this.app.use(auth(userName, userPass, deadtime));

    // jade
    this.app.engine("jade", jade.__express);
    this.app.set("views", ".");
    this.app.set("view options", { layout: false });

    // plugin rendering
    var pluginRoot = http.join(this.dynamicRoot, "plugins");
    this.app.use(pluginRoot, pluginRender(this));

    // static
    var cacheOpts = this.config.get("cache");
    this.app.use(this.staticRoot, express.static("static", cacheOpts));

    this.logger.info("Setup app");

    // apply the routes
    routes(this);


    /**
     * Websockets.
     */

    this.io = io(this.config.get("websocket:port"), { path: this.wsRoot });

    // store connected sockets
    this.io.on("connection", function(socket) {
      self.sockets[socket.id] = socket;

      self.logger.debug("Register socket", socket.id);

      // remove again on disconnect
      socket.on("disconnect", function() {
        delete self.sockets[socket.id];
        self.logger.debug("Deregister socket", socket.id);
      });

      // send back the id
      socket.emit("id", socket.id);

      // dispatch incomming messages for plugins
      socket.on("message.plugin", function(pluginName, topic) {
        var p = self.plugins[pluginName];
        if (!p) {
          self.logger.warn("Incomming message for unknown plugin '%s': %s", pluginName, topic);
          return;
        }

        // prepend the proper topic and the socket id
        var args = Array.prototype.slice.call(arguments, 2);
        args = ["in." + topic, socket.id].concat(args);

        // emit the message for the plugin
        p.emit.apply(p, args);
      });
    });

    this.logger.info("Setup websockets");


    /**
     * Setup plugins.
     */

    var pluginQueue = [];

    // loop through all files in the plugins directory
    var pluginNames = fs.readdirSync("plugins");
    for (var i in pluginNames) {
      var pluginName = pluginNames[i];

      var pluginRoot = path.join("plugins", pluginName);

      // directory?
      if (!fs.statSync(pluginRoot).isDirectory()) {
        continue;
      }

      // omit dirs beginning with an underscore
      if (pluginName[0] == "_") {
        continue;
      }

      pluginQueue.push(function(callback) {
        self.logger.info("Setup plugin '%s'", pluginName);

        // install plugin first if necessary
        self.installPlugin(pluginName, function(err) {
          if (err) {
            return callback(err);
          }

          // get the custom plugin class, create an instance and store it
          var PluginCls = require("../" + pluginRoot);
          var p = self.plugins[pluginName] = new PluginCls(self, pluginName);

          // call its setup
          p.setup();

          callback(null);
        });
      });
    }

    // process the callback queue
    async.series(pluginQueue, function(err) {
      if (err) {
        return callback(err);
      }

      self.logger.info("Setup plugins");

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
