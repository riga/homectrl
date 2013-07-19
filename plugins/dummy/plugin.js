// export a new module that enxtends the (global) Plugin definition
module.exports = Plugin.extend({

    // constructor
    init: function() {
        // the _super call (with all arguments) is mendatory
        this._super.apply(this, arguments);
    },

    // return js and css files that should be added to the main page
    files: function() {
        return {
            js: ["script.js"],
            css: ["styles.css"]
        };
    },

    // this handler is mapped to <base>+"plugins/dummy"
    _index_: function(req, res) {
        res.send("Dummy index page");
    }
});
