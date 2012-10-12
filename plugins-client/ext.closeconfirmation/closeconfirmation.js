/**
 * This plugin gives a 'close confirmation' when closing the IDE
 *
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("ext/settings/settings");
var markupSettings =  require("text!ext/closeconfirmation/settings.xml");

module.exports = ext.register("ext/closeconfirmation/closeconfirmation", {
    name    : "Confirm closing",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : null,
    
    deps    : [ settings ],
    
    nodes : [],
    
    init : function () {
        // when unloading the window
        window.onbeforeunload = this.onBeforeUnloadHandler;
        
        ide.addEventListener("settings.load", function(){
            settings.setDefaults("general", [
                ["confirmexit", "false"]
            ]);
        });
 
        settings.addSettings("General", markupSettings );
     
        // init extension
        ext.initExtension(this);
    },
    
    onBeforeUnloadHandler : function () {
        var changed = false;
        tabEditors.getPages().forEach(function(page){
            var node = page.$doc.getNode();
            if (node && node.getAttribute("changed") == 1 && page.$doc.getValue() && !node.getAttribute("deleted"))
                changed = true;
        });
        
        if (changed)
            return "You have unsaved changes. Your changes will be lost if you don't save them";
            
        // see what's in the settings
        var settingsNode = settings.model.queryNode("general/@confirmexit");
        if (settingsNode && apf.isTrue(settingsNode.value)) {
            return "You're about to leave Cloud9 IDE.";
        }
    },

    enable : function() {
        this.nodes.each(function(item){
            item.enable();
        });
    },
    
    disable : function() {
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function() {
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
        
        // clean out the event handler
        if (window.onbeforeunload === this.onBeforeUnloadHandler) {
            window.onbeforeunload = null;
        }
    }
});

});