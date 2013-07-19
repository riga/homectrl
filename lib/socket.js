var socketio = require("socket.io");

var Class = require("./class");

var SocketHandler = Class.extend({
    init: function(server) {
        this.server = server;

        this.config = server.config.get("websocket");
        this.sockets = {};
        this.io = null;

        this.connect();
    },

    connect: function() {
        var self = this;

        this.io = socketio.listen(this.config.port);
        this.io.set("logger", this.server.logger);
        this.io.on("connection", function(socket) {
            self.sockets[socket.id] = socket;
            socket.on("disconnect", function() {
                delete self.sockets[socket.id];
            });
        });
        return this;
    },

    getSocket: function(socketId) {
        return this.sockets[socketId];
    }
});


module.exports = SocketHandler;
