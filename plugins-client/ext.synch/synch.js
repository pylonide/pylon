/**
 * Synching for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("ext/settings/settings");

var markup = require("text!ext/synch/synch.xml");
var cssString = require("text!ext/synch/style.css");

module.exports = ext.register("ext/synch/synch", {
    name    : "Synch",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    nodes   : [],
    markup : markup,

    init : function(){
        var _self = this;
        
        apf.importCssString(cssString);
        
        ide.addEventListener("settings.load", function(e){ 
            settings.setDefaults("general", [
                ["synching", "true"]
            ]);
        });
        
        if (ide.local) {
            apf.setStyleClass(logobar.$ext, "local");
            
            var logoCorner = document.querySelector(".c9-mbar-cont");
            
            apf.setStyleClass(btnSyncStatus.$ext, "on");
            logoCorner.insertBefore(btnSyncStatus.$ext, logoCorner.childNodes[0]);
        }
    },
    
    setSynch : function() {
        if (apf.isTrue(settings.model.queryValue("general/@synching"))) {
            apf.setStyleClass(btnSyncStatus.$ext, "off", ["on"]);  
            settings.model.setQueryValue("general/@synching", "false");
        }
        else {
            apf.setStyleClass(btnSyncStatus.$ext, "on", ["off"]);  
            settings.model.setQueryValue("general/@synching", "true");
        }
    },
    
    enable : function() {
        
    },

    disable : function() {
        
    },

    destroy : function() {
        
    }
});

});
