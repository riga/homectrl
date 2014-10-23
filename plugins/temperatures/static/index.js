define(["homectrl"], function(hc) {
  return hc.Plugin._extend({
    init: function() {
      this._super();
      console.log("yay");
    }
  });
});
