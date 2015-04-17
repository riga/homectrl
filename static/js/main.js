// static/main.js

/**
 * This file is the data-main target of the requirejs script tag.
 */


/**
 * Define requirejs paths.
 */

var paths = {
  vendor        : "../vendor/",
  jquery        : "../vendor/jquery-2.1.3.min",
  jqCookie      : "../vendor/jquery.cookie-1.4.1.min",
  jqLogger      : "../vendor/jquery.logger-0.4.0.min",
  jqTransparency: "../vendor/jquery.transparency-0.10.0.min",
  bootstrap     : "../vendor/bootstrap-3.2.0/js/bootstrap.min",
  bsSwitch      : "../vendor/bootstrap.switch-3.1.0/js/bootstrap.switch.min",
  io            : "../vendor/socket.io-1.3.5.min",
  async         : "../vendor/async"
};

// change some paths in case CDN's are used
if (window.hcData.useCdn) {
  paths.jquery    = "//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min";
  paths.jqCookie  = "//cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min";
  paths.bootstrap = "//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.2.0/js/bootstrap.min";
  paths.io        = "//cdn.socket.io/socket.io-1.3.5";
}

// add plugins paths (/static/js) as "plugins/<name>"
window.hcData.plugins.forEach(function(name) {
  paths["plugins/" + name] = "/plugins/" + name + "/static/js";
});


/**
 * Configure requirejs.
 */

require.config({
  baseUrl: window.hcData.staticRoot + "js/",
  paths  : paths,
  shim   : {
    jqCookie      : [ "jquery" ],
    jqTransparency: [ "jquery" ],
    jqLogger      : [ "jquery" ],
    bootstrap     : [ "jquery" ],
    bsSwitch      : [ "bootstrap" ],
    homectrl      : [ "jqCookie", "jqTransparency", "bsSwitch", "jqLogger" ]
  }
});


/**
 * Start homectrl.
 */

require(["homectrl"]);
