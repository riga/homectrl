var fs     = require("fs"),
    exec   = require("child_process").exec,
    format = require("util").format,
    join   = require("path").join;

// export a new module that enxtends the (global) Plugin definition
module.exports = Plugin.extend({

    // constructor
    init: function() {
        // the _super call (with all arguments) is mendatory
        this._super.apply(this, arguments);

        this.cmd = "raspivid -n -t 15000 -w 640 -h 480 -o - | ffmpeg -i pipe:0 -c:v copy -f mp4 -frag_duration 15000 pipe:1 > %s";
        this.vidProcess = null;

        this.states = {};
    },

    // return js and css files that should be added to the main page
    files: function() {
        return {
            js: ["cam.js"],
            css: []
        };
    },

    makeFifo: function(callback) {
        var fifo = format("/tmp/fifo_%s", parseInt(Math.random()*1000));
        var p = exec("mkfifo " + fifo);
        if (callback)
            p.on("exit", function() {
                callback(fifo);
            });
        return this;
    },

    record: function(socketId) {
        var self = this;

        var socket = self.socket(socketId);

        this.states[socketId] = true;
        var p = exec("raspistill -n -t 0 -h 480 -w 640 -o - | base64");

        p.stdout.on("data", function(chunk) {
            if (socket)
                socket.emit("cam.chunk", chunk);
        });
        p.stdout.on("close", function() {
            if (socket)
                socket.emit("cam.complete");
            if (self.states[socketId])
                self.record(socketId);
        });
        return this;
    },

    _listen_: function(req, res) {
        this.record(req.body.socketId);
        res.send(1);
    },

    _unlisten_: function(req, res) {
        this.states[req.body.socketId] = false;
        res.send(1);
    },

    _stream_: function(req, res) {
        var self = this;

        this.makeFifo(function(fifo) {
            self.vidProcess = exec(format(self.cmd, fifo));
            fs.createReadStream(fifo).pipe(res);
        });
    }
});
