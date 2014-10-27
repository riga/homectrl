// configure requirejs
var paths = {
  vendor        : "../vendor",
  jquery        : "../vendor/jquery-2.1.1.min",
  jqCookie      : "../vendor/jquery.cookie-1.4.1.min",
  jqTransparency: "../vendor/jquery.transparency-0.10.0.min",
  bootstrap     : "../vendor/bootstrap-3.2.0/js/bootstrap.min",
  bsSwitch      : "../vendor/bootstrap.switch-3.1.0/js/bootstrap.switch.min",
  io            : "../vendor/socket.io-1.1.0.min"
};

if (window._hcData.useCdn) {
  paths.jquery    = "//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min";
  paths.jqCookie  = "//cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min";
  paths.bootstrap = "//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.2.0/js/bootstrap.min";
  paths.io        = "//cdn.socket.io/socket.io-1.1.0";
}

// add plugins to paths as "plugins/<name>"
window._hcData.plugins.forEach(function(name) {
  paths["plugins/" + name] = "../../plugins/" + name + "/static/js";
});

require.config({
  baseUrl: window._hcData.root + "static/js",
  paths: paths,
  shim: {
    jqCookie      : ["jquery"],
    jqTransparency: ["jquery"],
    bootstrap     : ["jquery"],
    bsSwitch      : ["bootstrap"],
    homectrl      : ["jqCookie", "jqTransparency", "bsSwitch"]
  }
});

require(["homectrl"]);
