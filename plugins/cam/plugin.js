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

        this.cmd = "raspivid -n -t 15000 -w 640 -h 480 -vf -hf -o - | ffmpeg -i pipe:0 -c:v copy -f mp4 -frag_duration 15000 pipe:1 > %s";
        this.vidProcess = null;
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

    _stream_: function(req, res) {
        var self = this;

        // TODO: kill an existing vidProcess

        this.makeFifo(function(fifo) {
            self.vidProcess = exec(format(self.cmd, fifo));
            fs.createReadStream(fifo).pipe(res);
        });
    }
});
