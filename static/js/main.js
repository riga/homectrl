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
  bootstrapCss  : "vendor/bootstrap-3.2.0/css/bootstrap.min",
  bsSwitch      : "vendor/bootstrap.switch-3.3.2/js/bootstrap.switch.min",
  bsSwitchCss   : "vendor/bootstrap.switch-3.3.2/css/bootstrap.switch.min",
  io            : "vendor/socket.io-1.3.5.min",
  highcharts    : "vendor/highcharts-4.1.5.min",
  fuelux        : "vendor/fuelux-3.6.3/js/fuelux.min",
  fueluxCss     : "vendor/fuelux-3.6.3/css/fuelux.min",
  async         : "vendor/async",
  moment        : "vendor/moment-2.10.2.min"
};

// change some paths in case CDN's are used
if (window.hcData.useCdn) {
  paths.jquery       = "//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min";
  paths.jqCookie     = "//cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min";
  paths.bootstrap    = "//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.2.0/js/bootstrap.min",
  paths.bootstrapCss = "//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.2.0/css/bootstrap.min";
  paths.bsSwitch     = "//cdnjs.cloudflare.com/ajax/libs/bootstrap-switch/3.3.2/js/bootstrap-switch.min";
  paths.io           = "//cdn.socket.io/socket.io-1.3.5";
  paths.highcharts   = "//cdnjs.cloudflare.com/ajax/libs/highcharts/4.1.5/highcharts.js";
  paths.fuelux       = "//www.fuelcdn.com/fuelux/3.6.3/js/fuelux.min.js";
  paths.fueluxCss    = "//www.fuelcdn.com/fuelux/3.6.3/css/fuelux.min";
  paths.moment       = "//cdnjs.cloudflare.com/ajax/libs/moment.js/2.10.2/moment.min"
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
    bootstrap     : [ "jquery", "style!bootstrapCss" ],
    bsSwitch      : [ "bootstrap", "style!bsSwitchCss" ],
    highcharts    : [ "jquery" ],
    fuelux        : [ "bootstrap", "style!fueluxCss" ],
    homectrl      : [
      "jqCookie", "jqTransparency", "bsSwitch", "jqLogger", "fuelux",
      "style!css/styles"
    ]
  },
  map: {
    "*": {
      style: "vendor/requirecss-0.1.8"
    }
  }
});


/**
 * Start homectrl.
 */

require(["homectrl"]);
