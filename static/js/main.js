// configure requirejs
require.config({
  baseUrl: window._tmplData.root + "static/js",
  paths: {
    jquery   : "//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min",
    bootstrap: "//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.2.0/js/bootstrap.min",
    socket   : "//cdn.socket.io/socket.io-1.1.0",
    vendor   : "../vendor",
    plugin   : "../../plugins"
  },
  shim: {
    bootstrap: ["jquery"],
    mmenu    : ["jquery"],
    homectrl : ["bootstrap"]
  }
});

require(["jquery", "vendor/Class"], function($, Class) {
  var pluginNames = window._tmplData.plugins;

  $("#splash").hide();

  var mode = "desktop";
  var setMode = function() {
    var width = $(window).width();
    var isMobile = width <= 1000;
    $("#homectrl")
      .toggleClass("desktop", !isMobile)
      .toggleClass("mobile", isMobile);
    mode = isMobile ? "mobile" : "desktop";
  };
  $(window).resize(setMode);
  setMode();

  var menuOpen = false;
  var toggleMenu = function(desired) {
    if (desired === true || desired === false) {
      if (desired == menuOpen) return;
      menuOpen = desired;
    } else {
      menuOpen = !menuOpen;
    }
    $("#homectrl").toggleClass("menu-open", menuOpen);
  };

  $("#menu-toggle").click(function(event) {
    event.preventDefault();
    toggleMenu();
  });

  $("#blocker").click(function(event) {
    event.preventDefault();
    toggleMenu(false);
  });

  // test
  toggleMenu(true);

  var pluginModules = pluginNames.map(function(name) {
    return "plugin/" + name + "/static/index";
  });
  require(pluginModules, function() {
    var plugins = Array.prototype.slice.call(arguments).filter(function(cls) {
      return true;
    }).map(function(Cls) {
      return new Cls();
    });
  });
});
