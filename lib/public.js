// public.js

/**
 * This file exports a plain object that is imported within plugins
 * when calling 'require("homectrl")`. Therefore, it is linked as
 * "node_modules/homectrl/index.js" on startup in "index.js".
 */


/**
 * Export.
 */
module.exports = {
  Plugin: require("./plugin"),
  send  : require("./http").send
};
