// configure requirejs
var paths = {
  vendor   : "../vendor",
  jquery   : "../vendor/jquery-2.1.1.min",
  cookie   : "../vendor/jquery.cookie-1.4.1.min",
  bootstrap: "../vendor/bootstrap/js/bootstrap-3.2.0.min",
  io       : "../vendor/socket.io-1.1.0.min"
};

if (window._hcData.useCdn) {
  paths.jquery    = "//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min";
  paths.cookie    = "//cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min";
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
    bootstrap: ["jquery"],
    homectrl : ["bootstrap", "cookie"]
  }
});

require(["homectrl"]);
