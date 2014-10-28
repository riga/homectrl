// server.js

// load node modules
var fs   = require("fs"),
    path = require("path"),
    util = require("util"),
    exec = require("child_process").exec;

// load npm modules
var express      = require("express"),
    nconf        = require("nconf"),
    winston      = require("winston"),
    morgan       = require("morgan"),
    compression  = require("compression"),
    session      = require("express-session"),
    bodyParser   = require("body-parser"),
    cookieParser = require("cookie-parser"),
    jade         = require("jade"),
    io           = require("socket.io"),
    async        = require("async");

// load local modules
var Emitter       = require("./util.js").Emitter,
    cli           = require("./cli.js"),
    auth          = require("./middleware/auth.js"),
    pluginRender  = require("./middleware/pluginrender.js"),
    routes        = require("./routes.js");


var Server = Emitter._extend({

  init: function(args) {
    this._super();

    this.args = args;

    this.config  = null;
    this.logger  = null;
    this.express = null;
    this.io      = null;
    this.sockets = {};
    this.plugins = {};

    // setup
    process.nextTick(this.setupComponents.bind(this));
    this.once("components.ready", this.setupApp.bind(this));
    this.once("app.ready",        this.setupIO.bind(this));
    this.once("io.ready",         this.setupPlugins.bind(this));
    this.once("plugins.ready",    this.emit.bind(this, "ready"));

    // bind shutdown hooks
    ["SIGUSR1", "SIGINT", "SIGTERM", "SIGQUIT"].forEach(function(signal) {
      process.on(signal, this.stop.bind(this, signal));
    }, this);
  },

  stop: function(signal) {
    (this.logger || console).log("info", "Shutdown due to signal: %s", signal || "None");
    process.exit(0);
    return this;
  },

  start: function() {
    var host    = this.config.get("app:host");
    var port    = this.config.get("app:port");
    var root    = this.config.get("app:root");
    var address = util.format("http://%s:%s%s", host, port, root);

    this.app.listen(port, host);
    this.logger.info("Start serving at", address);

    return this;
  },

  setupComponents: function() {
    var self = this;

    // load configs
    this.config = nconf.env();
    ["server", "logging"].forEach(function(key) {
      var file = path.join("conf", key + ".json");
      console.log("Load local config", file);
      self.config.file(key, file);
    });

    // overwrite config with cli args
    var overwrites = {
      host: "app:host",
      port: "app:port",
      root: "app:root"
    };
    Object.keys(overwrites).forEach(function(key) {
      if (self.args[key] !== undefined) {
        self.config.set(overwrites[key], self.args[key]);
      }
    });

    // logger
    // create winston transports based on the logging config
    var transports = [];
    Object.keys(this.config.get("logging:transports")).forEach(function(type) {
      var options = self.config.get("logging:transports")[type];
      if (!(options instanceof Array)) {
        options = [options];
      }
      options.forEach(function(opts) {
        if (type == "File") {
          if (self.args.logFile) {
            if (!fs.existsSync(self.args.logFile)) {
              fs.writeFileSync(self.args.logFile, "");
            }
            opts = util._extend({ filename: self.args.logFile }, opts);
          } else return;
        }
        transports.push(new winston.transports[type](opts));
      });
    });
    this.logger = new winston.Logger({
      levels    : this.config.get("logging:levels"),
      colors    : this.config.get("logging:colors"),
      transports: transports
    });
    this.logger.info("Setup winston logger");

    // emit that we're ready
    this.emit("components.ready");

    return this;
  },

  setupApp: function() {
    this.app = express();

    // access logger
    var self = this;
    var loggerStream = {
      write: function(message) {
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

    // sessions
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

    // plugin render
    var pluginRoot = this.config.get("app:root") + "plugins";
    this.app.use(pluginRoot, pluginRender(this));

    // static
    var staticRoot = this.config.get("app:root") + "static";
    var cacheOpts  = this.config.get("cache");
    this.app.use(staticRoot, express.static("static", cacheOpts));

    this.logger.info("Setup app");

    // apply the routes
    routes(this);

    // emit that we're ready
    this.emit("app.ready");

    return this;
  },

  setupIO: function() {
    var self = this;

    var path = this.config.get("app:root") + "socket.io";
    var port = this.config.get("io:port");

    this.io = io(port, { path: path });

    this.io.on("connection", function(socket) {
      self.sockets[socket.id] = socket;

      socket.on("disconnect", function() {
        delete self.sockets[socket.id];
        self.logger.debug("Deregister socket", socket.id);
      });

      socket.on("message.plugin", function(pluginName, topic) {
        var p = self.plugins[pluginName];
        if (!p) return;

        var args = Array.prototype.slice.call(arguments, 2);
        args = ["in." + topic, socket.id].concat(args);

        p.emit.apply(p, args);
      });

      // send back the id
      socket.emit("id", socket.id);

      self.logger.debug("Register socket", socket.id);
    });

    this.logger.info("Setup io");

    // emit that we're ready
    this.emit("io.ready");

    return this;
  },

  setupPlugins: function() {
    var self = this;

    var tasks = [];

    fs.readdirSync("plugins").forEach(function(dir) {
      var pluginRoot = path.join("plugins", dir);

      // directory?
      if (!fs.statSync(pluginRoot).isDirectory()) {
        return;
      }

      // omit dirs beginning with an underscore
      if (dir[0] == "_") {
        return;
      }

      // install the plugin
      if (!fs.existsSync(path.join(pluginRoot, "package.json"))) {
        return;
      }

      tasks.push(function(callback) {
        self.logger.info("Setup plugin '%s'", dir);

        exec("npm install", { cwd: pluginRoot }, function(err) {
          if (err) return callback(err);

          // the the custom plugin class, make an instance and store it
          var CustomPlugin = require("../" + pluginRoot);
          var p = self.plugins[dir] = new CustomPlugin(self, dir);

          // call setup
          p.setup();

          callback(null);
        });
      });
    });

    async.series(tasks, function(err) {
      if (err) return self.logger.error(err);

      // emit that we're ready
      self.emit("plugins.ready");
    });

    return this;
  }
});


var server = new Server(cli());
server.once("ready", server.start.bind(server));
