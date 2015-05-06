// static/main.js

/**
 * This file is the data-main target of the requirejs script tag.
 */


/**
 * Define requirejs paths.
 */

var paths = {
  homectrl      : window.hcData.staticRoot + "js/homectrl",
  emitter       : window.hcData.staticRoot + "js/emitter",
  vendor        : window.hcData.staticRoot + "vendor",
  jquery        : "vendor/jquery-2.1.3.min",
  jqCookie      : "vendor/jquery.cookie-1.4.1.min",
  jqLogger      : "vendor/jquery.logger-0.4.1.min",
  jqTransparency: "vendor/jquery.transparency-0.10.0.min",
  bootstrap     : "vendor/bootstrap-3.2.0/js/bootstrap.min",
  bsSwitch      : "vendor/bootstrap.switch-3.3.2/js/bootstrap.switch.min",
  io            : "vendor/socket.io-1.3.5.min",
  async         : "vendor/async"
};

// change some paths in case CDN's are used
if (window.hcData.useCdn) {
  paths.jquery    = "//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min";
  paths.jqCookie  = "//cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min";
  paths.bootstrap = "//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.2.0/js/bootstrap.min";
  paths.io        = "//cdn.socket.io/socket.io-1.3.5";
}


/**
 * Configure requirejs.
 */

require.config({
  baseUrl: window.hcData.staticRoot,
  paths  : paths,
  shim   : {
    jqCookie      : [ "jquery" ],
    jqTransparency: [ "jquery" ],
    jqLogger      : [ "jquery" ],
    bootstrap     : [ "jquery" ],
    bsSwitch      : [ "bootstrap" ],
    homectrl      : [ "jqCookie", "jqTransparency", "bsSwitch", "jqLogger" ]
  },
  map: {
    "*": {
      css: "vendor/requirecss-0.1.8"
    }
  }
});


/**
 * Start homectrl.
 */

require(["homectrl"]);
