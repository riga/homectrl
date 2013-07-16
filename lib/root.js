var util = require('util');

var Controller = require('node-controller');

var RootController = Controller.extend({
    init: function(parent) {
        this._super(parent);
    },

    _index_: function(req, res) {
        res.send("Hello World!!");
    }

});


module.exports = RootController;