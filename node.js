var express    = require("express"),
    nconf      = require("nconf"),
    winston    = require("winston"),
    path       = require("path"),
    fs         = require("fs"),
    jade       = require("jade");

var Class = require("./lib/class"),
    Root  = require("./lib/root");

var Server = Class.extend({
    init: function(base, conf) {
        var self = this;

        // find paths
        this.paths = {
            config: path.join(base, "config"),
            plugins: path.join(base, "plugins"),
            views: path.join(base, "jade"),
            public: path.join(base, "public")
        };

        // read the config
        var configFile = path.join(this.paths.config, conf || "homectrl.json");
        this.config = nconf.argv().env().file({file: configFile});

        // setup the logger
        var logConfig = this.config.get("logging");
        this.logger = new winston.Logger({
            levels: logConfig.levels,
            colors: logConfig.colors,
            transports: [
                new winston.transports.Console({
                    level: "debug",
                    colorize: true
                })
            ]
        });
        this.logger.info("Start winston logger");

        // start express app
        this.logger.info("Start the express app");
        this.app = express();

        // load jade templating
        this.logger.info("Start jade templating");
        this.app.engine("jade", jade.__express);
        this.app.set("views", this.paths.views);
        this.app.set("view options", {layout: false});

        // start the root controller
        this.logger.info("Start Root controller");
        this.root = new Root(this);

        // use middleware
        this.logger.info("Start middlewares");
        // access logger
        // this.app.use(express.logger());
        // gzip compression
        this.app.use(express.compress());
        // body parser
        this.app.use(express.bodyParser());
        // cookie parser
        this.app.use(express.cookieParser());
        // static content
        this.app.use(path.join(this.config.get("server:base"), "public"), express.static(this.paths.public));
        // root controller
        this.app.use(this.root.middleware(this.config.get("server:base") || "/"));

        // bind the shutdown hook
        ["SIGUSR1", "SIGINT", "SIGTERM", "SIGQUIT"].forEach(function(signal) {
            process.on(signal, self.exit.bind(self, signal));
        });
    },

    start: function() {
        var cfg = this.config.get("server");
        this.logger.log("info", "Start the server at %s:%s%s", cfg.host, cfg.port, cfg.base);
        this.app.listen(cfg.port, cfg.host);
        return this;
    },

    exit: function(signal) {
        this.logger.log("info", "Shutdown due to signal: %s", signal);
        process.exit(0);
        return this;
    }

});

var server = new Server(__dirname);
server.start();
