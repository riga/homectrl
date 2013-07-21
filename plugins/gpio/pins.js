var gpio = require("gpio");

var PinHandler = Class.extend({
    init: function(plugin) {
        this.plugin = plugin;
        this._pins = {};
    },

    unexport: function(pin) {
        if (this._pins[pin])
            this._pins[pin].unexport();
        return this;
    },

    defineOutput: function(pin, callback) {
        this.unexport(pin);
        this._pins[pin] = gpio.export(pin, {
            direction: "out",
            ready: callback || function(){}
        });
        return this;
    },

    defineInput: function(pin, callback) {
        if (callback === undefined && interval instanceof Function) {
            callback = interval;
            interval = 100;
        }
        this.unexport(pin);
        this._pins[pin] = gpio.export(pin, {
            direction: "in",
            ready: callback || function(){}
        });
        return this;
    },

    set: function(pin, value, callback) {
        if (!this._pins[pin])
            return this;
        value = value == "1" || value == "true" ? 1 : 0;
        this._pins[pin].set(value, callback || function(){});
        return this;
    },

    listen: function(pin, socketId, callback) {
        var self = this;

        if (!this._pins[pin])
            return this;

        var send = function(value) {
            var socket = self.plugin.socket(socketId);
            if (socket)
                socket.emit("gpio.input", {pin: pin, value: value ? "High" : "Low"});
        };
        this._pins[pin].on("change", send);
        if (callback)
            callback();
        return this;
    },

    unlisten: function(pin, callback) {
        if (!this._pins[pin])
            return this;
        this._pins[pin].removeAllListeners("change");
        if (callback)
            callback();
        return this;
    }
});


module.exports = PinHandler;
