// configure requirejs
require.config({
  baseUrl: window._homectrl.root + "static/js",
  paths: {
    jquery: "http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min",
    bootstrap: "http://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.2.0/js/bootstrap.min"
  },
  shim: {
    bootstrap: ["jquery"]
  }
});

require(["homectrl", "bootstrap"]);
