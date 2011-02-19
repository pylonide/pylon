/**
 * Connection Handling for Cloud9
 *
 * @copyright 2010, Ajax.org B.V.
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

return ext.register("ext/connect/connect", {
    dev         : "Ajax.org",
    name        : "Offline",
    alone       : true,
    type        : ext.GENERAL,
    deps        : [],
    
    init : function(){
        ide.addEventListener("socketConnect", function(e){
            ide.dispatchEvent("beforeonline");
            ide.dispatchEvent("afteronline");
            
            winReconnect.hide();
        });
        
        ide.addEventListener("socketDisconnect", function(e){
            ide.dispatchEvent("beforeoffline");
            ide.dispatchEvent("afteroffline");
            
            winReconnect.show();
        });
    },
    
    enable : function(){
    },
    
    disable : function(){
    },
    
    destroy : function(){
        //Remove all events
    }
});

});