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
        ide.onLine = -1;
        ide.addEventListener("socketConnect", function(e){
            ide.dispatchEvent("beforeonline");
            ide.dispatchEvent("afteronline");
            
            stServerConnected.activate();
            winReconnect.hide();
            
            ide.onLine = true;
        });
        
        ide.addEventListener("socketDisconnect", function(e){
            ide.dispatchEvent("beforeoffline");
            ide.dispatchEvent("afteroffline");
            
            stServerConnected.deactivate();
            winReconnect.show();
            
            ide.onLine = false;
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