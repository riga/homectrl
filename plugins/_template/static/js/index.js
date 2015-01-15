// client-side index.js

// we use requirejs (AMD) to load the homectrl module which contains
// the global homectrl instance and the Plugin base class
// additionally, we load jquery
// modules of this plugin, i.e. file located in plugins/{{name}}/static/js
// can be loaded via "plugins/{{name}}/someFileName"
define(["homectrl", "jquery"], function(hc, $) {

  // define and return our plugin
  // therefore, we extend (i.e. inherit from) the client-side homectrl.Plugin class
  return hc.Plugin._extend({

    // plugin method
    // invoked when all components of this plugin are set up
    setup: function() {
      // call the super class' setup method
      this.setup._super.call(this);

      /*
      the following members are provided:
        name        -> the name of the plugin, i.e. {{name}}
        dynamicRoot -> dynamic root
        staticRoot  -> static root
        label       -> the current label, initially the name
        iconClass   -> the current (full) bootstrap icon class
        nodes       -> an object containing the nodes $content, $menuItem, $menuItemLabel,
                       $menuItemIcon and $title
      */

      /*
      here, you may want to do your personal setup, e.g.
        this.addCss("styles.css"); // load and add a custom css file, relative to static/css
        this.setLabel("{{name}}"); // set the plugin label
        this.setIcon("check");     // set a bootstrap icon class
      */

      // setup messages
      this.setupMessages();

      // load the index template
      this.getTemplate("index.jade", function(tmpl) {
        this.nodes.$content.html(tmpl);
      }.bind(this));
    },

    // plugin method
    onShow: function() {
      // called when the plugin is shown
      return this;
    },

    // plugin method
    onHide: function() {
      // called when the plugin is hidden
      return this;
    },

    // custom method
    setupMessages: function() {
      /*
      here, you normally want to dispatch incomming messages, starting with "in.", e.g.:
        this.on("in.someTopic", function(arg1, argN) {
          // action
        });
      */

      return this;
    }

  });

});
