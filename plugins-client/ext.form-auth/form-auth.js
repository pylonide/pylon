define(function(require, exports, module) {
  
  var ext = require("core/ext");
  var menus = require("ext/menus/menus");
  
  module.exports = ext.register("ext/form-auth/form-auth", {
    dev: "Pylonide",
    name: "form-auth",
    alone: true,
    type: ext.GENERAL,
    nodes: [],

    init: function() {
      this.nodes.push(menus.addItemByPath("File/~", new apf.divider(), 900000));
      this.nodes.push(
        menus.addItemByPath("File/Sign Out",
        this.mnuItem = new apf.item({
          onclick : function(){
                location.href = "/logout";
          }
        }), 950000)
      );
    }
    
  });
  
});