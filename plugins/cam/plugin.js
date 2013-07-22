var fs   = require("fs"),
    exec = require("child_process").exec;

// export a new module that enxtends the (global) Plugin definition
module.exports = Plugin.extend({

    // constructor
    init: function() {
        // the _super call (with all arguments) is mendatory
        this._super.apply(this, arguments);

        this.workflow = {
            imgName: "/tmp/homectrl_img.jpg",
            socketStates: {}
        };
    },

    // return js and css files that should be added to the main page
    files: function() {
        return {
            js: ["cam.js"],
            css: []
        };
    },

    record: function(socketId) {
        // todo: block double sending per socketId
        var self = this;
        this.workflow.socketStates[socketId] = true;
        var p = exec("raspistill -n -t 0 -w 640 -h 480 -o " + this.workflow.imgName);
        p.on("exit", function() {
            var socket = self.socket(socketId);
            fs.readFile(self.workflow.imgName, function(err, data) {
                socket.emit("cam.img", data.toString("base64"));
                if (self.workflow.socketStates[socketId])
                    self.record(socketId);
            });
        });
    },

    _listen_: function(req, res) {
        this.record(req.body.socketId);
        res.send(1);
    },

    _unlisten_: function(req, res) {
        this.workflow.socketStates[req.body.socketId] = false;
        res.send(1);
    }
});
