var PinHandler = require("./pins");

// export a new module that enxtends the (global) Plugin definition
module.exports = Plugin.extend({

    // constructor
    init: function() {
        // the _super call (with all arguments) is mendatory
        this._super.apply(this, arguments);

        this.pins = new PinHandler(this);
    },

    // return js and css files that should be added to the main page
    files: function() {
        return {
            js: ["gpio.js"],
            css: []
        };
    },

    _unexport_: function(req, res) {
        this.pins.unexport(req.body.pin);
        res.send({success: true});
    },

    _defineoutput_: function(req, res) {
        this.pins.defineOutput(req.body.pin, function() {
            res.send({success: true});
        });
    },

    _defineinput_: function(req, res) {
        this.pins.defineInput(req.body.pin, function() {
            res.send({success: true});
        });
    },

    _set_: function(req, res) {
        this.pins.set(req.body.pin, req.body.value, function() {
            res.send({success: true});
        });
    },

    _listen_: function(req, res) {
        this.pins.listen(req.body.pin, req.body.socketId, function() {
            res.send({success: true});
        });
    },

    _unlisten_: function(req, res) {
        this.pins.unlisten(req.body.pin, function() {
            res.send({success: true});
        });
    }
});
